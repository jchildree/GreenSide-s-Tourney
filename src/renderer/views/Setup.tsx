import { useEffect, useState } from 'react'
import type { Tourney } from '../../shared/types'
import { DEFAULT_TOURNEY } from '../../shared/types'

type FieldKey = 'name' | 'game' | 'dateTime' | 'signupDeadline' | 'draftStyle' | 'minPlayers' | 'maxPlayers' | 'teamSize'
type ScalarFieldKey = 'name' | 'game' | 'dateTime' | 'signupDeadline' | 'minPlayers' | 'maxPlayers'

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }): JSX.Element {
  return (
    <button
      type="button"
      aria-checked={on}
      role="switch"
      onClick={onToggle}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '36px',
        height: '20px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        background: on ? 'var(--color-gold)' : 'var(--color-border)',
        transition: 'background 0.2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: on ? 'calc(100% - 17px)' : '3px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: on ? '#ffffff' : 'var(--color-muted)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

export function Setup(): JSX.Element {
  const [tourney, setTourney] = useState<Tourney>(DEFAULT_TOURNEY)
  const [status, setStatus] = useState('')

  useEffect(() => {
    window.api.getTourney().then(data =>
      setTourney(t => ({ ...t, ...data }))
    )
  }, [])

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    await window.api.saveTourney(tourney)
    setStatus('Saved.')
    setTimeout(() => setStatus(''), 3000)
  }

  function isEnabled(key: FieldKey): boolean {
    return tourney.enabledFields?.[key] !== false
  }

  function toggleField(key: FieldKey): void {
    setTourney(t => ({
      ...t,
      enabledFields: {
        ...t.enabledFields,
        [key]: !(t.enabledFields?.[key] !== false),
      },
    }))
  }

  function fieldRow(
    label: string,
    key: FieldKey,
    input: (disabled: boolean) => JSX.Element,
  ): JSX.Element {
    const enabled = isEnabled(key)
    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.25rem',
          }}
        >
          <label className="form-label" style={{ margin: 0 }}>{label}</label>
          <Toggle on={enabled} onToggle={() => toggleField(key)} />
        </div>
        {input(!enabled)}
      </div>
    )
  }

  function textInput(key: ScalarFieldKey, type: string, disabled: boolean): JSX.Element {
    return (
      <input
        type={type}
        value={tourney[key]}
        onChange={e =>
          setTourney(t => ({
            ...t,
            [key]: type === 'number' ? Number(e.target.value) : e.target.value,
          }))
        }
        className="form-input"
        disabled={disabled}
        style={{ opacity: disabled ? 0.4 : 1 }}
      />
    )
  }

  return (
    <div>
      <h2 className="view-title">Tournament Setup</h2>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {fieldRow('Tournament Name', 'name', d => textInput('name', 'text', d))}
          {fieldRow('Game', 'game', d => textInput('game', 'text', d))}
          {fieldRow('Date / Time', 'dateTime', d => textInput('dateTime', 'datetime-local', d))}
          {fieldRow('Signup Deadline', 'signupDeadline', d => textInput('signupDeadline', 'datetime-local', d))}
        </div>

        {fieldRow('Draft Style', 'draftStyle', disabled => (
          <select
            value={tourney.draftStyle}
            onChange={e =>
              setTourney(t => ({ ...t, draftStyle: e.target.value as Tourney['draftStyle'] }))
            }
            className="form-input"
            disabled={disabled}
            style={{ opacity: disabled ? 0.4 : 1 }}
          >
            <option value="random">Random</option>
            <option value="snake">Snake</option>
            <option value="manual">Manual</option>
          </select>
        ))}

        {fieldRow('Team Size', 'teamSize', d => (
          <input
            type="number"
            min={1}
            max={20}
            value={tourney.teamSize}
            onChange={e => setTourney(t => ({ ...t, teamSize: Number(e.target.value) }))}
            className="form-input"
            disabled={d}
            style={{ opacity: d ? 0.4 : 1 }}
          />
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {fieldRow('Min Players', 'minPlayers', d => textInput('minPlayers', 'number', d))}
          {fieldRow('Max Players', 'maxPlayers', d => textInput('maxPlayers', 'number', d))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem' }}>
          <button type="submit" className="btn-gold">Save Setup</button>
          {status && <span className="status-ok">{status}</span>}
        </div>
      </form>
    </div>
  )
}
