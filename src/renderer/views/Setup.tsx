import { useEffect, useState } from 'react'
import type { Tourney } from '../../shared/types'
import { DEFAULT_TOURNEY } from '../../shared/types'

export function Setup(): JSX.Element {
  const [tourney, setTourney] = useState<Tourney>(DEFAULT_TOURNEY)
  const [status, setStatus] = useState('')
  const [newTeamName, setNewTeamName] = useState('')

  useEffect(() => {
    window.api.getTourney().then(t => {
      setTourney({ ...DEFAULT_TOURNEY, ...t })
    })
  }, [])

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    await window.api.saveTourney(tourney)
    setStatus('Saved.')
    setTimeout(() => setStatus(''), 3000)
  }

  function field(label: string, key: keyof Tourney, type = 'text'): JSX.Element {
    return (
      <div>
        <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>{label}</label>
        <input
          type={type}
          value={tourney[key] as string | number}
          onChange={e =>
            setTourney(t => ({
              ...t,
              [key]: type === 'number' ? Number(e.target.value) : e.target.value,
            }))
          }
          className="form-input"
        />
      </div>
    )
  }

  function addTeam(): void {
    const name = newTeamName.trim()
    if (!name || tourney.teamNames.includes(name)) return
    setTourney(t => ({ ...t, teamNames: [...t.teamNames, name] }))
    setNewTeamName('')
  }

  function removeTeam(name: string): void {
    setTourney(t => ({ ...t, teamNames: t.teamNames.filter(n => n !== name) }))
  }

  function renameTeam(idx: number, value: string): void {
    setTourney(t => {
      const next = [...t.teamNames]
      next[idx] = value
      return { ...t, teamNames: next }
    })
  }

  return (
    <div>
      <h2 className="view-title">Tournament Setup</h2>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {field('Tournament Name', 'name')}
          {field('Game', 'game')}
          {field('Date / Time', 'dateTime', 'datetime-local')}
          {field('Signup Deadline', 'signupDeadline', 'datetime-local')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Draft Style</label>
            <select
              value={tourney.draftStyle}
              onChange={e =>
                setTourney(t => ({ ...t, draftStyle: e.target.value as Tourney['draftStyle'] }))
              }
              className="form-input"
            >
              <option value="random">Random</option>
              <option value="snake">Snake</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          {field('Players Per Team', 'teamSize', 'number')}
          {field('Min Players', 'minPlayers', 'number')}
          {field('Max Players', 'maxPlayers', 'number')}
        </div>

        <div>
          <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Teams ({tourney.teamNames.length})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.5rem' }}>
            {tourney.teamNames.map((name, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{
                  color: 'rgba(34, 197, 94, 0.4)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  minWidth: '1.5rem',
                  textAlign: 'right',
                }}>
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={e => renameTeam(idx, e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => removeTeam(name)}
                  className="btn-ghost"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-muted)' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Team name..."
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTeam() } }}
              className="form-input"
              style={{ flex: 1 }}
            />
            <button type="button" onClick={addTeam} className="btn-ghost">
              Add Team
            </button>
          </div>
          {tourney.teamNames.length > 0 && (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginTop: '0.375rem' }}>
              {tourney.teamNames.length} teams x {tourney.teamSize} players = {tourney.teamNames.length * tourney.teamSize} total picks
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem' }}>
          <button type="submit" className="btn-gold">Save Setup</button>
          {status && <span className="status-ok">{status}</span>}
        </div>
      </form>
    </div>
  )
}
