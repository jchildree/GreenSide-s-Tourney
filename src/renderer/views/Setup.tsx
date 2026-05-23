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
  }

  function field(label: string, key: keyof Tourney, type = 'text'): JSX.Element {
    return (
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        {label}
        <input
          type={type}
          value={tourney[key] as string | number}
          onChange={e => setTourney(t => ({ ...t, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          style={{ marginLeft: '0.5rem' }}
        />
      </label>
    )
  }

  return (
    <form onSubmit={handleSave}>
      <h2>Tournament Setup</h2>
      {field('Name', 'name')}
      {field('Game', 'game')}
      {field('Date/Time', 'dateTime', 'datetime-local')}
      {field('Signup Deadline', 'signupDeadline', 'datetime-local')}
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        Draft Style
        <select
          value={tourney.draftStyle}
          onChange={e => setTourney(t => ({ ...t, draftStyle: e.target.value as Tourney['draftStyle'] }))}
          style={{ marginLeft: '0.5rem' }}
        >
          <option value="random">Random</option>
          <option value="snake">Snake</option>
          <option value="manual">Manual</option>
        </select>
      </label>
      {field('Min Players', 'minPlayers', 'number')}
      {field('Max Players', 'maxPlayers', 'number')}
      <button type="submit">Save</button>
      {status && <span style={{ marginLeft: '1rem' }}>{status}</span>}
    </form>
  )
}
