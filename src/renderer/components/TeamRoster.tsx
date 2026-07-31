import { useRef, useState } from 'react'
import type { Team } from '../../shared/types'

interface TeamRosterProps {
  teams: Team[]
  allPlayers?: string[]
  highlightedTeam?: string
  teamSize?: number
  onRenameTeam?: (oldName: string, newName: string) => void
  onRemovePlayer?: (teamName: string, playerName: string) => void
  onAddPlayer?: (teamName: string, playerName: string) => void
}

interface TeamCardProps {
  team: Team
  unassignedPlayers: string[]
  highlighted?: boolean
  teamSize?: number
  onRenameTeam?: (oldName: string, newName: string) => void
  onRemovePlayer?: (teamName: string, playerName: string) => void
  onAddPlayer?: (teamName: string, playerName: string) => void
}

function TeamCard({
  team,
  unassignedPlayers,
  highlighted = false,
  teamSize,
  onRenameTeam,
  onRemovePlayer,
  onAddPlayer,
}: TeamCardProps): JSX.Element {
  const [editMode, setEditMode] = useState(false)
  const [nameValue, setNameValue] = useState(team.name)
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isEditable = Boolean(onRenameTeam ?? onRemovePlayer ?? onAddPlayer)
  const full = teamSize !== undefined && team.players.length >= teamSize

  function commitRename(): void {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== team.name && onRenameTeam) {
      onRenameTeam(team.name, trimmed)
    } else {
      setNameValue(team.name)
    }
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') nameInputRef.current?.blur()
    else if (e.key === 'Escape') { setNameValue(team.name); nameInputRef.current?.blur() }
  }

  function handleAddPlayer(): void {
    if (selectedPlayer && onAddPlayer) {
      onAddPlayer(team.name, selectedPlayer)
      setSelectedPlayer('')
    }
  }

  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid',
      borderColor: highlighted
        ? 'var(--color-gold)'
        : full
          ? 'rgba(var(--glow-rgb), 0.45)'
          : 'var(--color-border)',
      boxShadow: highlighted ? '0 0 10px rgba(200, 169, 110, 0.35)' : 'none',
      borderRadius: '0.8rem',
      padding: '1rem 1.125rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.625rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid rgba(var(--glow-rgb), 0.2)',
      }}>
        {editMode && onRenameTeam ? (
          <input
            ref={nameInputRef}
            className="form-input"
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleNameKeyDown}
            style={{
              flex: 1,
              fontSize: '0.97rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0.25rem 0.5rem',
            }}
          />
        ) : (
          <h3 style={{
            flex: 1,
            margin: 0,
            color: 'var(--color-gold)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            fontSize: '0.97rem',
            textTransform: 'uppercase',
          }}>
            {team.name}
          </h3>
        )}

        {teamSize !== undefined && (
          <span style={{
            fontSize: '0.85rem',
            color: full ? 'var(--color-primary)' : 'var(--color-muted)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {team.players.length}/{teamSize}
          </span>
        )}

        {isEditable && (
          <button
            onClick={() => setEditMode(m => !m)}
            style={{
              padding: '0.3rem 0.7rem',
              borderRadius: '0.45rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              color: 'var(--color-silver)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
            }}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {team.players.map(p => (
          <li key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ flex: 1, color: 'var(--color-silver)', fontSize: '0.97rem' }}>{p}</span>
            {editMode && onRemovePlayer && (
              <button
                onClick={() => onRemovePlayer(team.name, p)}
                aria-label={`Remove ${p}`}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  lineHeight: 1,
                  padding: '0.25rem 0.4rem',
                  borderRadius: '0.25rem',
                }}
              >
                ✕
              </button>
            )}
          </li>
        ))}
        {team.players.length === 0 && (
          <li style={{ fontSize: '0.9rem', color: 'var(--color-muted)', fontStyle: 'italic', padding: '0.25rem 0' }}>
            No players yet
          </li>
        )}
      </ul>

      {editMode && onAddPlayer && unassignedPlayers.length > 0 && (
        <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.7rem', alignItems: 'center' }}>
          <select
            className="form-input"
            value={selectedPlayer}
            onChange={e => setSelectedPlayer(e.target.value)}
            style={{ flex: 1, fontSize: '0.9rem', padding: '0.35rem 0.5rem' }}
          >
            <option value="">Add a player…</option>
            {unassignedPlayers.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            onClick={handleAddPlayer}
            disabled={!selectedPlayer}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '0.45rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              cursor: selectedPlayer ? 'pointer' : 'default',
              color: 'var(--color-bg)',
              background: 'var(--color-primary)',
              border: '1px solid var(--color-primary)',
              opacity: selectedPlayer ? 1 : 0.4,
            }}
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
  highlightedTeam,
  teamSize,
  onRenameTeam,
  onRemovePlayer,
  onAddPlayer,
}: TeamRosterProps): JSX.Element {
  if (teams.length === 0) {
    return (
      <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', fontStyle: 'italic', margin: 0 }}>
        No teams assigned yet.
      </p>
    )
  }

  const allAssigned = new Set(teams.flatMap(t => t.players))
  const trulyUnassigned = (allPlayers ?? []).filter(p => !allAssigned.has(p))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))', gap: '0.875rem' }}>
      {teams.map(team => (
        <TeamCard
          key={team.name}
          team={team}
          unassignedPlayers={trulyUnassigned}
          highlighted={highlightedTeam === team.name}
          teamSize={teamSize}
          onRenameTeam={onRenameTeam}
          onRemovePlayer={onRemovePlayer}
          onAddPlayer={onAddPlayer}
        />
      ))}
    </div>
  )
}
