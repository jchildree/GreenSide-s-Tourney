import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { Timer } from '../components/Timer'
import { PlayerCard } from '../components/PlayerCard'
import { TeamRoster } from '../components/TeamRoster'
import { PickWheel } from '../components/PickWheel'
import {
  computeTeamCount,
  autoNameTeams,
  randomAssign,
  snakeAssign,
  applyPicks,
  unassignedPlayers,
} from '../utils/draftModes'
import type { Player, Team, DraftPick, Tourney } from '../../shared/types'

type DraftMode = 'random' | 'snake' | 'manual'

export function Draft(): JSX.Element {
  const [signups, setSignups] = useState<Player[]>([])
  const [picks, setPicks] = useState<DraftPick[]>([])
  const [teamNames, setTeamNames] = useState<string[]>([])
  const [mode, setMode] = useState<DraftMode>('random')
  const [tourney, setTourney] = useState<Tourney | null>(null)
  const [dragActive, setDragActive] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [status, setStatus] = useState('')

  // Load data on mount
  useEffect(() => {
    Promise.all([window.api.getSignups(), window.api.getDraft(), window.api.getTourney()])
      .then(([s, d, t]) => {
        setSignups(s)
        setTourney(t)
        if (d.teams.length > 0) {
          // Restore existing draft
          setTeamNames(d.teams.map(tm => tm.name))
          const restoredPicks: DraftPick[] = d.teams.flatMap((tm, _ti) =>
            tm.players.map((p, pi) => ({ playerName: p, teamName: tm.name, pickNumber: pi + 1 }))
          )
          setPicks(restoredPicks)
        } else {
          // Auto-generate teams
          const count = computeTeamCount(s.length, t.teamSize ?? 4)
          setTeamNames(autoNameTeams(count))
        }
      })
  }, [])

  const playerNames = signups.map(p => p.name)
  const teams: Team[] = applyPicks(picks)
  const unassigned = unassignedPlayers(playerNames, picks)

  // --- Random mode ---
  function handleAssignAll(): void {
    const newPicks = randomAssign(playerNames, teamNames)
    setPicks(newPicks)
  }

  function handleSpinComplete(playerName: string): void {
    setSpinning(false)
    // Derive nextTeam inside the functional updater so it uses the latest picks count,
    // not the stale closure value — prevents mis-assignment if state changed during spin.
    setPicks(prev => {
      const nextTeam = teamNames[prev.length % teamNames.length]
      return [...prev, { playerName, teamName: nextTeam, pickNumber: prev.length + 1 }]
    })
  }

  // --- Snake mode ---
  function handleSnakeAssign(): void {
    const newPicks = snakeAssign(playerNames, teamNames)
    setPicks(newPicks)
  }

  // --- Manual DnD ---
  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    setDragActive(null)
    if (!over) return
    const playerName = active.id as string
    const targetId = over.id as string // teamName or 'pool'
    if (targetId === 'pool') {
      // Return to pool
      setPicks(prev => prev.filter(p => p.playerName !== playerName))
    } else {
      // Assign to team
      const existing = picks.find(p => p.playerName === playerName)
      if (existing?.teamName === targetId) return
      const newPicks = picks.filter(p => p.playerName !== playerName)
      newPicks.push({ playerName, teamName: targetId, pickNumber: newPicks.length + 1 })
      setPicks(newPicks)
    }
  }

  // --- Team editing ---
  function handleRenameTeam(oldName: string, newName: string): void {
    setTeamNames(prev => prev.map(n => n === oldName ? newName : n))
    setPicks(prev => prev.map(p => p.teamName === oldName ? { ...p, teamName: newName } : p))
  }

  function handleRemovePlayer(teamName: string, playerName: string): void {
    setPicks(prev => prev.filter(p => !(p.teamName === teamName && p.playerName === playerName)))
  }

  function handleAddPlayer(teamName: string, playerName: string): void {
    setPicks(prev => [...prev, { playerName, teamName, pickNumber: prev.length + 1 }])
  }

  // --- Save ---
  async function handleSave(): Promise<void> {
    await window.api.saveDraft(picks)
    setStatus('Draft saved.')
    setTimeout(() => setStatus(''), 2500)
  }

  function handleReset(): void {
    setPicks([])
  }

  // Mode button style helper
  const modeBtn = (m: DraftMode): React.CSSProperties => ({
    padding: '0.35rem 0.85rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    background: mode === m ? 'linear-gradient(160deg, #1e3a5f 0%, #1a2e4a 100%)' : 'transparent',
    color: mode === m ? 'var(--color-gold)' : 'var(--color-muted)',
    border: '1px solid',
    borderColor: mode === m ? 'var(--color-border)' : 'transparent',
    borderRadius: '0.3rem',
    cursor: 'pointer',
  })

  const teamCount = teamNames.length
  const playerCount = signups.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 className="view-title">Draft Board</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>
            {playerCount} players &bull; {teamCount} teams of {tourney?.teamSize ?? 4}
          </p>
        </div>
        {/* Mode selector */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {(['random', 'snake', 'manual'] as DraftMode[]).map(m => (
            <button key={m} style={modeBtn(m)} onClick={() => setMode(m)}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Main two-panel layout */}
      <DndContext
        onDragEnd={handleDragEnd}
        onDragStart={e => setDragActive(e.active.id as string)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem', alignItems: 'start' }}>
          {/* LEFT: Player Pool */}
          <PlayerPool
            players={signups}
            picks={picks}
            draggable={mode === 'manual'}
            dragActive={dragActive}
          />

          {/* RIGHT: Teams */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mode === 'snake' && (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.72rem', margin: 0 }}>
                Snake order: {teamNames.join(' > ')} &gt; {[...teamNames].reverse().join(' > ')} &gt; ...
              </p>
            )}
            <TeamRoster
              teams={teams}
              allPlayers={playerNames}
              onRenameTeam={handleRenameTeam}
              onRemovePlayer={handleRemovePlayer}
              onAddPlayer={handleAddPlayer}
            />
            {/* Empty team placeholders for unassigned teams */}
            {teamNames.filter(n => !teams.find(t => t.name === n)).map(name => (
              <TeamDropZone key={name} teamName={name} mode={mode} />
            ))}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {dragActive && (() => {
            const p = signups.find(s => s.name === dragActive)
            if (!p) return null
            const pick = picks.find(pk => pk.playerName === dragActive)
            return <PlayerCard player={p} assigned={!!pick} teamName={pick?.teamName} draggable />
          })()}
        </DragOverlay>
      </DndContext>

      {/* Action bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--color-border)',
      }}>
        {mode === 'random' && (
          <>
            <PickWheel
              players={unassigned}
              onSpinComplete={handleSpinComplete}
              onSpinStart={() => setSpinning(true)}
            />
            <button className="btn-gold" onClick={handleAssignAll} disabled={playerCount === 0 || spinning}>
              Assign All
            </button>
          </>
        )}
        {mode === 'snake' && (
          <button className="btn-gold" onClick={handleSnakeAssign} disabled={playerCount === 0}>
            Assign All (Snake)
          </button>
        )}
        {mode === 'manual' && (
          <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', margin: 0 }}>
            Drag players from the pool into teams
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <Timer initialSeconds={60} />
        </div>
      </div>

      {/* Save/Reset */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button className="btn-gold" onClick={handleSave}>Save Draft</button>
        <button className="btn-ghost" onClick={handleReset}>Reset Draft</button>
        {status && <span className="status-ok">{status}</span>}
      </div>
    </div>
  )
}

/* ---- Player Pool panel ---- */

interface PlayerPoolProps {
  players: Player[]
  picks: DraftPick[]
  draggable: boolean
  dragActive: string | null
}

function PlayerPool({ players, picks, draggable, dragActive }: PlayerPoolProps): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })

  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${isOver ? 'var(--color-gold)' : 'var(--color-border)'}`,
        borderRadius: '0.5rem',
        padding: '0.75rem',
        minHeight: '300px',
        transition: 'border-color 150ms',
      }}
    >
      <p style={{
        color: 'var(--color-muted)',
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        margin: '0 0 0.6rem',
      }}>
        Player Pool ({players.length})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {players.length === 0 && (
          <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
            No players. Fetch signups in Control tab.
          </p>
        )}
        {players.map(player => {
          const pick = picks.find(p => p.playerName === player.name)
          if (draggable) {
            return (
              <DraggablePlayer
                key={player.name}
                player={player}
                pick={pick}
                isDragging={dragActive === player.name}
              />
            )
          }
          return (
            <PlayerCard
              key={player.name}
              player={player}
              assigned={!!pick}
              teamName={pick?.teamName}
            />
          )
        })}
      </div>
    </div>
  )
}

function DraggablePlayer({
  player,
  pick,
  isDragging,
}: {
  player: Player
  pick?: DraftPick
  isDragging: boolean
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: player.name })
  const transformStyle: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : {}
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <PlayerCard
        player={player}
        assigned={!!pick}
        teamName={pick?.teamName}
        draggable
        style={transformStyle}
      />
    </div>
  )
}

/* ---- Empty team drop zone ---- */

function TeamDropZone({ teamName, mode }: { teamName: string; mode: DraftMode }): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: teamName })
  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: 'var(--color-card)',
        border: `1px dashed ${isOver ? 'var(--color-gold)' : 'var(--color-border)'}`,
        borderRadius: '0.5rem',
        padding: '0.75rem',
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 150ms',
      }}
    >
      <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', margin: 0 }}>
        <strong style={{ color: 'var(--color-gold)' }}>{teamName}</strong>
        {mode === 'manual' ? ' -- drop players here' : ' -- no players yet'}
      </p>
    </div>
  )
}
