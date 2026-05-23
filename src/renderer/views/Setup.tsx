import { useEffect, useState } from 'react'
import type { Tourney } from '../../shared/types'
import { DEFAULT_TOURNEY } from '../../shared/types'

export function Setup(): JSX.Element {
  const [tourney, setTourney] = useState<Tourney>(DEFAULT_TOURNEY)
  const [status, setStatus] = useState('')

  useEffect(() => {
    window.api.getTourney().then(setTourney)
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

  return (
    <div>
      <h2 className="view-title">Tournament Setup</h2>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {field('Tournament Name', 'name')}
          {field('Game', 'game')}
          {field('Date / Time', 'dateTime', 'datetime-local')}
          {field('Signup Deadline', 'signupDeadline', 'datetime-local')}
        </div>

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {field('Min Players', 'minPlayers', 'number')}
          {field('Max Players', 'maxPlayers', 'number')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem' }}>
          <button type="submit" className="btn-gold">Save Setup</button>
          {status && <span className="status-ok">{status}</span>}
        </div>
      </form>
    </div>
  )
}
