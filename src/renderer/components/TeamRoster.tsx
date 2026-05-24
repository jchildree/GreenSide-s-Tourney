import { useState, useRef } from 'react'
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
  /** Players not assigned to ANY team — computed by TeamRoster and passed down. */
  unassignedPlayers: string[]
  onRenameTeam?: (oldName: string, newName: string) => void
  onRemovePlayer?: (teamName: string, playerName: string) => void
  onAddPlayer?: (teamName: string, playerName: string) => void
}

function TeamCard({
  team,
  unassignedPlayers,
  onRenameTeam,
  onRemovePlayer,
  onAddPlayer,
}: TeamCardProps): JSX.Element {
  const [editMode, setEditMode] = useState(false)
  const [nameValue, setNameValue] = useState(team.name)
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isEditable = Boolean(onRenameTeam ?? onRemovePlayer ?? onAddPlayer)

  function commitRename(): void {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== team.name && onRenameTeam) {
      onRenameTeam(team.name, trimmed)
    } else {
      setNameValue(team.name)
    }
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      nameInputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setNameValue(team.name)
      nameInputRef.current?.blur()
    }
  }

  function handleAddPlayer(): void {
    if (selectedPlayer && onAddPlayer) {
      onAddPlayer(team.name, selectedPlayer)
      setSelectedPlayer('')
    }
  }

  return (
    <div className="card" style={{ borderColor: 'rgba(200, 169, 110, 0.2)', position: 'relative' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(200, 169, 110, 0.2)', paddingBottom: '0.25rem' }}>
        {editMode && onRenameTeam ? (
          <input
            ref={nameInputRef}
            className="form-input"
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleNameKeyDown}
            style={{ flex: 1, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.125rem 0.375rem' }}
          />
        ) : (
          <h3 style={{
            flex: 1,
            color: 'var(--color-gold)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            {team.name}
          </h3>
        )}

        {isEditable && (
          editMode ? (
            <button
              className="btn-ghost"
              onClick={() => setEditMode(false)}
              style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}
            >
              Done
            </button>
          ) : (
            <button
              className="btn-ghost"
              onClick={() => setEditMode(true)}
              style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}
            >
              Edit
            </button>
          )
        )}
      </div>

      {/* Player list */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        {team.players.map(p => (
          <li key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ flex: 1, color: 'var(--color-silver)', fontSize: '0.875rem' }}>{p}</span>
            {editMode && onRemovePlayer && (
              <button
                onClick={() => onRemovePlayer(team.name, p)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  lineHeight: 1,
                  padding: '0.1rem 0.25rem',
                  borderRadius: '0.25rem',
                }}
                aria-label={`Remove ${p}`}
              >
                x
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Add player row */}
      {editMode && onAddPlayer && unassignedPlayers.length > 0 && (
        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem', alignItems: 'center' }}>
          <select
            className="form-input"
            value={selectedPlayer}
            onChange={e => setSelectedPlayer(e.target.value)}
            style={{ flex: 1, fontSize: '0.8rem', padding: '0.1rem 0.375rem' }}
          >
            <option value="">-- add player --</option>
            {unassignedPlayers.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            className="btn-gold"
            onClick={handleAddPlayer}
            disabled={!selectedPlayer}
            style={{ fontSize: '0.75rem', padding: '0.1rem 0.625rem' }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}

export function TeamRoster({
  teams,
  allPlayers,
  onRenameTeam,
  onRemovePlayer,
  onAddPlayer,
}: TeamRosterProps): JSX.Element {
  if (teams.length === 0) {
    return <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No teams assigned yet.</p>
  }

  // Compute players not assigned to ANY team so each TeamCard dropdown only shows
  // genuinely unassigned players (prevents double-assigning a player).
  const allAssigned = new Set(teams.flatMap(t => t.players))
  const trulyUnassigned = (allPlayers ?? []).filter(p => !allAssigned.has(p))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
      {teams.map(team => (
        <TeamCard
          key={team.name}
          team={team}
          unassignedPlayers={trulyUnassigned}
          onRenameTeam={onRenameTeam}
          onRemovePlayer={onRemovePlayer}
          onAddPlayer={onAddPlayer}
        />
      ))}
    </div>
  )
}
