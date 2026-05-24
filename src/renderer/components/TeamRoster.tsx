import { useState, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { Team } from '../../shared/types'

interface TeamRosterProps {
  teams: Team[]
  allPlayers?: string[]
  onRenameTeam?: (oldName: string, newName: string) => void
  onRemovePlayer?: (teamName: string, playerName: string) => void
  onAddPlayer?: (teamName: string, playerName: string) => void
}

interface TeamCardProps {
  team: Team
  allPlayers: string[]
  onRenameTeam?: (oldName: string, newName: string) => void
  onRemovePlayer?: (teamName: string, playerName: string) => void
  onAddPlayer?: (teamName: string, playerName: string) => void
}

function TeamCard({ team, allPlayers, onRenameTeam, onRemovePlayer, onAddPlayer }: TeamCardProps): JSX.Element {
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(team.name)
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [playerInput, setPlayerInput] = useState('')

  // Keep nameInput in sync when team.name changes externally (e.g. after a rename)
  useEffect(() => {
    if (!editing) setNameInput(team.name)
  }, [team.name, editing])

  const { setNodeRef, isOver } = useDroppable({ id: team.name })

  const unassignedPlayers = allPlayers.filter(p => !team.players.includes(p))

  function commitRename(): void {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== team.name && onRenameTeam) {
      onRenameTeam(team.name, trimmed)
    } else {
      setNameInput(team.name)
    }
    setEditing(false)
  }

  function handleAddPlayer(): void {
    const trimmed = playerInput.trim()
    if (trimmed && onAddPlayer) {
      onAddPlayer(team.name, trimmed)
    }
    setPlayerInput('')
    setAddingPlayer(false)
  }

  return (
    <div
      ref={setNodeRef}
      className="card"
      style={{
        borderColor: isOver ? 'var(--color-gold)' : 'rgba(200, 169, 110, 0.2)',
        transition: 'border-color 150ms',
        backgroundColor: isOver ? 'rgba(200, 169, 110, 0.04)' : undefined,
      }}
    >
      {/* Team name header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(200, 169, 110, 0.2)', paddingBottom: '0.25rem' }}>
        {editing ? (
          <input
            className="form-input"
            value={nameInput}
            autoFocus
            onChange={e => setNameInput(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setNameInput(team.name); setEditing(false) } }}
            style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
          />
        ) : (
          <h3
            onClick={() => onRenameTeam && setEditing(true)}
            style={{
              color: 'var(--color-gold)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              margin: 0,
              flex: 1,
              cursor: onRenameTeam ? 'text' : 'default',
            }}
          >
            {team.name}
          </h3>
        )}
        <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>
          {team.players.length} players
        </span>
      </div>

      {/* Player list */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        {team.players.map(p => (
          <li
            key={p}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--color-silver)',
              fontSize: '0.875rem',
              padding: '0.15rem 0',
            }}
          >
            <span>{p}</span>
            {onRemovePlayer && (
              <button
                onClick={() => onRemovePlayer(team.name, p)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '0 0.2rem',
                  lineHeight: 1,
                }}
                title="Remove player"
              >
                x
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Add player */}
      {onAddPlayer && (
        <div style={{ marginTop: '0.5rem' }}>
          {addingPlayer ? (
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <select
                className="form-input"
                value={playerInput}
                onChange={e => setPlayerInput(e.target.value)}
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
              >
                <option value="">Select player...</option>
                {unassignedPlayers.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button className="btn-gold" onClick={handleAddPlayer} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Add</button>
              <button className="btn-ghost" onClick={() => { setAddingPlayer(false); setPlayerInput('') }} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Cancel</button>
            </div>
          ) : (
            <button
              className="btn-ghost"
              onClick={() => setAddingPlayer(true)}
              disabled={unassignedPlayers.length === 0}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', width: '100%' }}
            >
              + Add Player
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function TeamRoster({ teams, allPlayers = [], onRenameTeam, onRemovePlayer, onAddPlayer }: TeamRosterProps): JSX.Element {
  if (teams.length === 0) {
    return <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No teams assigned yet.</p>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
      {teams.map(team => (
        <TeamCard
          key={team.name}
          team={team}
          allPlayers={allPlayers}
          onRenameTeam={onRenameTeam}
          onRemovePlayer={onRemovePlayer}
          onAddPlayer={onAddPlayer}
        />
      ))}
    </div>
  )
}
