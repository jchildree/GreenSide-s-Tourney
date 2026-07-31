import { useState, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { Timer } from '../components/Timer'
import { PlayerCard } from '../components/PlayerCard'
import { TeamRoster } from '../components/TeamRoster'
import { PickWheel } from '../components/PickWheel'
import { GHOST_BUTTON, PRIMARY_BUTTON, VIEW_TITLE, disabledIf } from '../components/ui'
import {
  computeTeamCount,
  autoNameTeams,
  randomAssign,
  snakeAssign,
  applyPicks,
  unassignedPlayers,
  filterPlayersByName,
  buildSnakeQueue,
} from '../utils/draftModes'
import type { Player, Team, DraftPick, Tourney, DraftSession } from '../../shared/types'
import { DEFAULT_DRAFT_SESSION } from '../../shared/types'

type DraftMode = 'random' | 'snake' | 'manual'

const MODE_LABELS: Record<DraftMode, string> = {
  random: 'Random wheel',
  snake: 'Snake draft',
  manual: 'Manual',
}

const MODE_HINTS: Record<DraftMode, string> = {
  random: 'Spin the wheel — each winner joins the next team in line. Or press “Assign all” to fill every team at once.',
  snake: 'Teams pick in turn, and the order reverses each round. Spin or click a player, then confirm the pick.',
  manual: 'Drag players from the pool onto a team. Drag them back to the pool to undo.',
}

interface DraftProps {
  onChanged?: () => void
}

/** Step 3 — logic unchanged from the original view; layout and copy rebuilt. */
export function Draft({ onChanged }: DraftProps = {}): JSX.Element {
  const [signups, setSignups] = useState<Player[]>([])
  const [picks, setPicks] = useState<DraftPick[]>([])
  const [teamNames, setTeamNames] = useState<string[]>([])
  const [mode, setMode] = useState<DraftMode>('random')
  const [tourney, setTourney] = useState<Tourney | null>(null)
  const [dragActive, setDragActive] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [status, setStatus] = useState('')
  const [snakePickIdx, setSnakePickIdx] = useState(0)
  const [pendingSnakePick, setPendingSnakePick] = useState<string | null>(null)
  const [timerDuration, setTimerDuration] = useState(60)
  const [remainingSeconds, setRemainingSeconds] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const sessionRef = useRef<DraftSession>(DEFAULT_DRAFT_SESSION)
  const prevPickCountRef = useRef(0)

  useEffect(() => {
    void Promise.all([
      window.api.getSignups(),
      window.api.getDraft(),
      window.api.getTourney(),
      window.api.getDraftSession(),
    ]).then(([s, d, t, session]) => {
      setSignups(s)
      setTourney(t)
      sessionRef.current = session
      setTimerDuration(session.timerDuration)
      setRemainingSeconds(session.remainingSeconds)
      if (t.draftStyle) setMode(t.draftStyle as DraftMode)
      if (d.teams.length > 0) {
        setTeamNames(d.teams.map(tm => tm.name))
        const restoredPicks: DraftPick[] = d.teams.flatMap(tm =>
          tm.players.map((p, pi) => ({ playerName: p, teamName: tm.name, pickNumber: pi + 1 }))
        )
        setPicks(restoredPicks)
      } else {
        const count = computeTeamCount(s.length, t.teamSize ?? 4)
        setTeamNames(autoNameTeams(count))
      }
    })
  }, [])

  const playerNames = signups.map(p => p.name)
  const teams: Team[] = applyPicks(picks)
  const unassigned = unassignedPlayers(playerNames, picks)
  const snakeQueue = buildSnakeQueue(teamNames, playerNames.length)
  const currentSnakeTeam = snakeQueue[snakePickIdx] ?? null

  useEffect(() => {
    if (mode === 'snake') return
    const prev = prevPickCountRef.current
    prevPickCountRef.current = picks.length
    if (picks.length === prev) return
    if (picks.length === prev + 1) {
      setRemainingSeconds(timerDuration)
      setTimerRunning(true)
    } else {
      setTimerRunning(false)
    }
  }, [picks.length, timerDuration, mode])

  useEffect(() => {
    if (mode !== 'snake') {
      setPendingSnakePick(null)
      setTimerRunning(false)
      prevPickCountRef.current = picks.length
    }
  }, [mode]) // picks.length intentionally omitted — only resets on mode change

  function handleDurationChange(seconds: number): void {
    setTimerDuration(seconds)
    setRemainingSeconds(seconds)
    const session = { ...sessionRef.current, timerDuration: seconds, remainingSeconds: seconds }
    sessionRef.current = session
    void window.api.saveDraftSession(session)
  }

  function advanceSnakePick(): void {
    const teamName = snakeQueue[snakePickIdx]
    if (pendingSnakePick && teamName) {
      setPicks(prev => [...prev, { playerName: pendingSnakePick, teamName, pickNumber: prev.length + 1 }])
    }
    setPendingSnakePick(null)
    setSnakePickIdx(prev => prev + 1)
    setRemainingSeconds(timerDuration)
    setTimerRunning(true)
  }

  function handleSelectSnakePlayer(name: string): void {
    setPendingSnakePick(prev => (prev === name ? null : name))
  }

  function handleSnakeSpinComplete(playerName: string): void {
    setSpinning(false)
    setPendingSnakePick(playerName)
  }

  function handleAssignAll(): void {
    setPicks(randomAssign(playerNames, teamNames))
  }

  function handleSpinComplete(playerName: string): void {
    setSpinning(false)
    setPicks(prev => {
      const nextTeam = teamNames[prev.length % teamNames.length]
      return [...prev, { playerName, teamName: nextTeam, pickNumber: prev.length + 1 }]
    })
  }

  function handleSnakeAssign(): void {
    setPicks(snakeAssign(playerNames, teamNames))
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    setDragActive(null)
    if (!over) return
    const playerName = active.id as string
    const targetId = over.id as string
    if (targetId === 'pool') {
      setPicks(prev => prev.filter(p => p.playerName !== playerName))
    } else {
      const existing = picks.find(p => p.playerName === playerName)
      if (existing?.teamName === targetId) return
      const newPicks = picks.filter(p => p.playerName !== playerName)
      newPicks.push({ playerName, teamName: targetId, pickNumber: newPicks.length + 1 })
      setPicks(newPicks)
    }
  }

  function handleRenameTeam(oldName: string, newName: string): void {
    setTeamNames(prev => prev.map(n => (n === oldName ? newName : n)))
    setPicks(prev => prev.map(p => (p.teamName === oldName ? { ...p, teamName: newName } : p)))
  }

  function handleRemovePlayer(teamName: string, playerName: string): void {
    setPicks(prev => prev.filter(p => !(p.teamName === teamName && p.playerName === playerName)))
  }

  function handleAddPlayer(teamName: string, playerName: string): void {
    setPicks(prev => [...prev, { playerName, teamName, pickNumber: prev.length + 1 }])
  }

  async function handleSave(): Promise<void> {
    await window.api.saveDraft(picks)
    setStatus('Draft saved.')
    onChanged?.()
    setTimeout(() => setStatus(''), 2500)
  }

  function handleReset(): void {
    setPicks([])
    setSnakePickIdx(0)
    setPendingSnakePick(null)
  }

  const modeBtn = (m: DraftMode): CSSProperties => ({
    padding: '0.55rem 1rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    background: mode === m ? 'var(--color-card)' : 'transparent',
    color: mode === m ? 'var(--color-gold)' : 'var(--color-muted)',
    border: '2px solid',
    borderColor: mode === m ? 'var(--color-gold)' : 'var(--color-border)',
    borderRadius: '0.55rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  })

  const teamCount = teamNames.length
  const playerCount = signups.length
  const assignedCount = picks.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
      <div>
        <h2 style={VIEW_TITLE}>Step 3 · Draft teams</h2>
        <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: 'var(--color-silver)' }}>
          {playerCount} player{playerCount === 1 ? '' : 's'} · {teamCount} team{teamCount === 1 ? '' : 's'} of{' '}
          {tourney?.teamSize ?? 4} · {assignedCount} drafted
        </p>
      </div>

      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backgroundColor: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0.75rem 0',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['random', 'snake', 'manual'] as DraftMode[]).map(m => (
            <button key={m} style={modeBtn(m)} onClick={() => setMode(m)}>
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {mode === 'random' && (
          <>
            <PickWheel players={unassigned} onSpinComplete={handleSpinComplete} onSpinStart={() => setSpinning(true)} />
            <button
              onClick={handleAssignAll}
              disabled={playerCount === 0 || spinning}
              style={disabledIf(playerCount === 0 || spinning, GHOST_BUTTON)}
            >
              Assign all
            </button>
          </>
        )}

        {mode === 'snake' && (
          currentSnakeTeam ? (
            <>
              <span style={{
                color: 'var(--color-gold)',
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'rgba(200,169,110,0.1)',
                border: '1px solid var(--color-gold)',
                borderRadius: '0.45rem',
                padding: '0.5rem 0.875rem',
                whiteSpace: 'nowrap',
              }}>
                {currentSnakeTeam} is picking
              </span>
              <PickWheel players={unassigned} onSpinStart={() => setSpinning(true)} onSpinComplete={handleSnakeSpinComplete} />
              <button
                onClick={advanceSnakePick}
                disabled={!pendingSnakePick}
                style={disabledIf(!pendingSnakePick, PRIMARY_BUTTON)}
              >
                {pendingSnakePick ? `Confirm ${pendingSnakePick}` : 'Confirm pick'}
              </button>
              <button
                onClick={handleSnakeAssign}
                disabled={playerCount === 0 || spinning}
                style={disabledIf(playerCount === 0 || spinning, GHOST_BUTTON)}
              >
                Assign all
              </button>
            </>
          ) : (
            <span style={{ fontSize: '0.95rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              ✓ Every player has a team
            </span>
          )
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginLeft: 'auto' }}>
          <Timer
            durationSeconds={timerDuration}
            remainingSeconds={remainingSeconds}
            running={timerRunning}
            onDurationChange={handleDurationChange}
            onToggle={() => setTimerRunning(r => !r)}
            onReset={() => { setRemainingSeconds(timerDuration); setTimerRunning(false) }}
            onTick={setRemainingSeconds}
            onExpire={() => {
              if (mode === 'snake' && currentSnakeTeam) advanceSnakePick()
              else setTimerRunning(false)
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={handleSave} style={PRIMARY_BUTTON} data-testid="save-draft">Save draft</button>
            <button onClick={handleReset} style={{ ...GHOST_BUTTON, color: 'var(--color-muted)' }}>Reset draft</button>
          </div>
          {status && <span className="status-ok" style={{ fontSize: '0.95rem' }}>{status}</span>}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.97rem', color: 'var(--color-silver)', textWrap: 'pretty' }}>
        {MODE_HINTS[mode]}
      </p>

      {mode === 'snake' && teamCount > 0 && (
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-muted)' }}>
          Pick order: {teamNames.join(' → ')} → {[...teamNames].reverse().join(' → ')} → …
        </p>
      )}

      <DndContext onDragEnd={handleDragEnd} onDragStart={e => setDragActive(e.active.id as string)}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(18rem, 22rem) 1fr', gap: '1.125rem', alignItems: 'start' }}>
          <PlayerPool
            players={signups}
            picks={picks}
            draggable={mode === 'manual'}
            dragActive={dragActive}
            selectedPlayer={mode === 'snake' ? pendingSnakePick : null}
            onSelectPlayer={mode === 'snake' ? handleSelectSnakePlayer : undefined}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <TeamRoster
              teams={teams}
              allPlayers={playerNames}
              teamSize={tourney?.teamSize ?? 4}
              highlightedTeam={mode === 'snake' ? currentSnakeTeam ?? undefined : undefined}
              onRenameTeam={handleRenameTeam}
              onRemovePlayer={handleRemovePlayer}
              onAddPlayer={handleAddPlayer}
            />
            {teamNames.filter(n => !teams.find(t => t.name === n)).map(name => (
              <TeamDropZone
                key={name}
                teamName={name}
                mode={mode}
                highlighted={mode === 'snake' && name === currentSnakeTeam}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {dragActive && (() => {
            const p = signups.find(s => s.name === dragActive)
            if (!p) return null
            const pick = picks.find(pk => pk.playerName === dragActive)
            return <PlayerCard player={p} assigned={!!pick} teamName={pick?.teamName} draggable />
          })()}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

interface PlayerPoolProps {
  players: Player[]
  picks: DraftPick[]
  draggable: boolean
  dragActive: string | null
  selectedPlayer?: string | null
  onSelectPlayer?: (name: string) => void
}

function PlayerPool({ players, picks, draggable, dragActive, selectedPlayer, onSelectPlayer }: PlayerPoolProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })
  const displayed = filterPlayersByName(players, searchQuery)
  const remaining = unassignedPlayers(players.map(p => p.name), picks).length

  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${isOver ? 'var(--color-gold)' : 'var(--color-border)'}`,
        borderRadius: '0.8rem',
        padding: '1rem',
        minHeight: '19rem',
        maxHeight: 'calc(100vh - 22rem)',
        overflowY: 'auto',
        transition: 'border-color 150ms',
      }}
    >
      <p style={{
        margin: '0 0 0.7rem',
        color: 'var(--color-muted)',
        fontSize: '0.85rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>
        Player pool · {remaining} left
      </p>
      <input
        type="search"
        placeholder="Search players…"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.5rem',
          color: 'var(--color-text)',
          fontSize: '0.95rem',
          padding: '0.55rem 0.7rem',
          marginBottom: '0.7rem',
          outline: 'none',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {players.length === 0 && (
          <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            No players yet. Go back to <strong>Step 2 · Signups</strong> and fetch your form responses.
          </p>
        )}
        {displayed.map(player => {
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
          const isAssigned = !!pick
          return (
            <PlayerCard
              key={player.name}
              player={player}
              assigned={isAssigned}
              teamName={pick?.teamName}
              selected={!isAssigned && selectedPlayer === player.name}
              onClick={!isAssigned && onSelectPlayer ? () => onSelectPlayer(player.name) : undefined}
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
  const transformStyle: CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : {}
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <PlayerCard player={player} assigned={!!pick} teamName={pick?.teamName} draggable style={transformStyle} />
    </div>
  )
}

function TeamDropZone({ teamName, mode, highlighted }: { teamName: string; mode: DraftMode; highlighted?: boolean }): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: teamName })
  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: 'var(--color-card)',
        border: `1px ${highlighted ? 'solid' : 'dashed'} ${isOver || highlighted ? 'var(--color-gold)' : 'var(--color-border)'}`,
        boxShadow: highlighted ? '0 0 10px rgba(200, 169, 110, 0.35)' : 'none',
        borderRadius: '0.8rem',
        padding: '1rem',
        minHeight: '5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 150ms',
      }}
    >
      <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.95rem' }}>
        <strong style={{ color: 'var(--color-gold)' }}>{teamName}</strong>
        {mode === 'manual' ? ' — drop players here' : ' — no players yet'}
      </p>
    </div>
  )
}
