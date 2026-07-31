import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Tourney } from '../../shared/types'
import { DEFAULT_TOURNEY } from '../../shared/types'

type FieldKey = 'name' | 'game' | 'dateTime' | 'signupDeadline' | 'draftStyle' | 'minPlayers' | 'maxPlayers' | 'teamSize'
type ScalarFieldKey = 'name' | 'game' | 'dateTime' | 'signupDeadline' | 'minPlayers' | 'maxPlayers'

const CARD: CSSProperties = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.85rem',
  padding: '1.375rem 1.5rem',
}

const EYEBROW: CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-primary)',
}

const LABEL: CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'var(--color-silver)',
}

const DRAFT_STYLES: { id: Tourney['draftStyle']; label: string; desc: string }[] = [
  { id: 'random', label: 'Random wheel', desc: 'Spin a wheel — every pick is a surprise' },
  { id: 'snake',  label: 'Snake draft',  desc: 'Teams take turns, order reverses each round' },
  { id: 'manual', label: 'Manual',       desc: 'You place every player yourself' },
]

/** Small switch controlling whether a field gets pushed onto the Google Form. */
function OnFormToggle({ on, onToggle }: { on: boolean; onToggle: () => void }): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? 'Included on form' : 'Hidden from form'}
      title={on ? 'Shown on the signup form' : 'Hidden from the signup form'}
      onClick={onToggle}
      style={{
        position: 'relative',
        width: '2.25rem',
        height: '1.25rem',
        borderRadius: '0.625rem',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        background: on ? 'var(--color-primary)' : 'var(--color-border)',
        transition: 'background 200ms ease',
      }}
    >
      <span style={{
        position: 'absolute',
        top: '0.1875rem',
        left: on ? 'calc(100% - 1.0625rem)' : '0.1875rem',
        width: '0.875rem',
        height: '0.875rem',
        borderRadius: '50%',
        background: on ? '#ffffff' : 'var(--color-muted)',
        transition: 'left 200ms ease',
      }} />
    </button>
  )
}

interface SetupProps {
  onSaved?: () => void
}

export function Setup({ onSaved }: SetupProps = {}): JSX.Element {
  const [tourney, setTourney] = useState<Tourney>(DEFAULT_TOURNEY)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void window.api.getTourney().then(data => setTourney(t => ({ ...t, ...data })))
  }, [])

  function isEnabled(key: FieldKey): boolean {
    return tourney.enabledFields?.[key] !== false
  }

  function toggleField(key: FieldKey): void {
    setTourney(t => ({
      ...t,
      enabledFields: { ...t.enabledFields, [key]: !(t.enabledFields?.[key] !== false) },
    }))
    setSaved(false)
  }

  function field(
    label: string,
    key: FieldKey,
    input: (disabled: boolean) => JSX.Element,
  ): JSX.Element {
    const enabled = isEnabled(key)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ ...LABEL, flex: 1 }}>{label}</span>
          <OnFormToggle on={enabled} onToggle={() => toggleField(key)} />
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
        disabled={disabled}
        onChange={e => {
          const value = type === 'number' ? Number(e.target.value) : e.target.value
          setTourney(t => ({ ...t, [key]: value }))
          setSaved(false)
        }}
        className="form-input"
        style={{ minHeight: '2.6rem', fontSize: '1rem', opacity: disabled ? 0.4 : 1 }}
      />
    )
  }

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    await window.api.saveTourney(tourney)
    setSaved(true)
    onSaved?.()
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 700 }}>Step 1 · Set up your tournament</h2>
      <p style={{ margin: '0 0 1.5rem', fontSize: '1rem', color: 'var(--color-silver)', textWrap: 'pretty' }}>
        These details fill in your Google signup form automatically. Switch a field off to leave it off the form.
        You can come back and change any of this later.
      </p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
        <div style={CARD}>
          <p style={{ ...EYEBROW, marginBottom: '1rem' }}>The basics</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1.125rem' }}>
            {field('Tournament name', 'name', d => textInput('name', 'text', d))}
            {field('Game', 'game', d => textInput('game', 'text', d))}
            {field('Date & start time', 'dateTime', d => textInput('dateTime', 'datetime-local', d))}
            {field('Signups close', 'signupDeadline', d => textInput('signupDeadline', 'datetime-local', d))}
          </div>
          <div style={{ marginTop: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <span style={LABEL}>Stream link (optional)</span>
            <input
              type="url"
              value={tourney.streamLink ?? ''}
              onChange={e => { setTourney(t => ({ ...t, streamLink: e.target.value })); setSaved(false) }}
              className="form-input"
              placeholder="https://twitch.tv/…"
              style={{ width: '100%', minHeight: '2.6rem', fontSize: '1rem' }}
            />
          </div>
        </div>

        <div style={CARD}>
          <p style={EYEBROW}>Teams &amp; draft</p>
          <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            How players get split into teams on draft night.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
            <span style={{ ...LABEL, flex: 1 }}>Draft style</span>
            <OnFormToggle on={isEnabled('draftStyle')} onToggle={() => toggleField('draftStyle')} />
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1.125rem' }}>
            {DRAFT_STYLES.map(d => {
              const active = tourney.draftStyle === d.id
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { setTourney(t => ({ ...t, draftStyle: d.id })); setSaved(false) }}
                  style={{
                    flex: 1,
                    minWidth: '11rem',
                    textAlign: 'left',
                    padding: '0.875rem 1rem',
                    borderRadius: '0.7rem',
                    cursor: 'pointer',
                    background: 'var(--color-surface)',
                    border: '2px solid',
                    borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  <span style={{ display: 'block', fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem' }}>{d.label}</span>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.4 }}>{d.desc}</span>
                </button>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1.125rem' }}>
            {field('Players per team', 'teamSize', d => (
              <input
                type="number"
                min={1}
                max={20}
                value={tourney.teamSize}
                disabled={d}
                onChange={e => { setTourney(t => ({ ...t, teamSize: Number(e.target.value) })); setSaved(false) }}
                className="form-input"
                style={{ minHeight: '2.6rem', fontSize: '1rem', opacity: d ? 0.4 : 1 }}
              />
            ))}
            {field('Min players', 'minPlayers', d => textInput('minPlayers', 'number', d))}
            {field('Max players', 'maxPlayers', d => textInput('maxPlayers', 'number', d))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="submit"
            data-testid="save-setup"
            style={{
              padding: '0.8rem 1.85rem',
              borderRadius: '0.6rem',
              fontWeight: 700,
              fontSize: '0.97rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              color: 'var(--color-bg)',
              background: 'linear-gradient(160deg, var(--color-bright, var(--color-primary)) 0%, var(--color-primary) 45%, var(--color-deep, var(--color-primary)) 100%)',
              border: '1px solid var(--color-deep, var(--color-primary))',
              boxShadow: '0 0 18px rgba(var(--glow-rgb), 0.45)',
            }}
          >
            Save &amp; continue
          </button>
          {saved && <span className="status-ok" style={{ fontSize: '0.95rem' }}>✓ Saved</span>}
        </div>
      </form>
    </div>
  )
}
