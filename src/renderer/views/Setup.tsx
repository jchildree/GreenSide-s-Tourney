import { useEffect, useState } from 'react'
import type { Tourney } from '../../shared/types'
import { DEFAULT_TOURNEY } from '../../shared/types'

export function Setup(): JSX.Element {
  const [tourney, setTourney] = useState<Tourney>(DEFAULT_TOURNEY)
  const [signupCount, setSignupCount] = useState(0)
  const [status, setStatus] = useState('')
  const [newTeamName, setNewTeamName] = useState('')

  useEffect(() => {
    Promise.all([window.api.getTourney(), window.api.getSignups()]).then(([t, signups]) => {
      const merged = { ...DEFAULT_TOURNEY, ...t }
      const count = signups.length
      setSignupCount(count)
      if (merged.teamNames.length === 0 && count > 0) {
        const suggested = Math.ceil(count / Math.max(1, merged.teamSize))
        merged.teamNames = Array.from({ length: suggested }, (_, i) => `Team ${i + 1}`)
      }
      setTourney(merged)
    }).catch(() => {})
  }, [])

  const suggestedCount = Math.ceil(signupCount / Math.max(1, tourney.teamSize))

  function syncToSignups(): void {
    setTourney(t => {
      const current = t.teamNames
      const target = Math.ceil(signupCount / Math.max(1, t.teamSize))
      if (current.length < target) {
        const appended = Array.from(
          { length: target - current.length },
          (_, i) => `Team ${current.length + i + 1}`
        )
        return { ...t, teamNames: [...current, ...appended] }
      }
      if (current.length > target) {
        return { ...t, teamNames: current.slice(0, target) }
      }
      return t
    })
  }

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

  function removeTeam(idx: number): void {
    setTourney(t => ({ ...t, teamNames: t.teamNames.filter((_, i) => i !== idx) }))
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

        {field('Stream Link (optional)', 'streamLink', 'url')}

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <label className="form-label" style={{ display: 'block' }}>
              Teams ({tourney.teamNames.length})
            </label>
            <button
              type="button"
              onClick={syncToSignups}
              className="btn-ghost"
              style={{ padding: '0.125rem 0.5rem', fontSize: '0.75rem' }}
            >
              Sync to Signups
            </button>
          </div>
          {signupCount > 0 && (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: '0.5rem', marginTop: 0 }}>
              {signupCount} signups / {tourney.teamSize} per team = {suggestedCount} suggested
            </p>
          )}
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
                  onClick={() => removeTeam(idx)}
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
