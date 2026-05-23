import { useState, useEffect } from 'react'
import { Setup } from './views/Setup'
import { Draft } from './views/Draft'
import { Bracket } from './views/Bracket'
import { Control } from './views/Control'
import { Onboarding } from './views/Onboarding'

type View = 'setup' | 'draft' | 'bracket' | 'control'

const NAV: { id: View; label: string }[] = [
  { id: 'setup',   label: 'Setup'   },
  { id: 'draft',   label: 'Draft'   },
  { id: 'bracket', label: 'Bracket' },
  { id: 'control', label: 'Control' },
]

export function App(): JSX.Element {
  const [view, setView] = useState<View>('setup')
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  useEffect(() => {
    window.api.checkOnboarding().then(status => setOnboarded(status.complete))
  }, [])

  if (onboarded === null) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Loading…</span>
      </div>
    )
  }

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        flexShrink: 0,
      }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{
            color: 'var(--color-gold)',
            fontWeight: 700,
            fontSize: '1.25rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            lineHeight: 1,
            margin: 0,
          }}>
            Tourney
          </h1>
          <p style={{
            color: 'var(--color-muted)',
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            margin: '0.2rem 0 0',
          }}>
            Tournament Dashboard
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'row', gap: '0.25rem' }}>
          {NAV.map(({ id, label }) => {
            const active = view === id
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: active
                    ? 'linear-gradient(160deg, #1e3a5f 0%, #1a2e4a 100%)'
                    : 'transparent',
                  color: active ? 'var(--color-gold)' : 'var(--color-muted)',
                  border: '1px solid',
                  borderColor: active ? 'var(--color-border)' : 'transparent',
                  borderRadius: '0.3rem',
                  cursor: 'pointer',
                  transition: 'color 150ms ease, background 150ms ease, border-color 150ms ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    const el = e.currentTarget
                    el.style.color = 'var(--color-silver)'
                    el.style.borderColor = 'var(--color-border)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    const el = e.currentTarget
                    el.style.color = 'var(--color-muted)'
                    el.style.borderColor = 'transparent'
                  }
                }}
              >
                {label}
              </button>
            )
          })}
        </nav>
      </header>

      <main style={{
        flex: 1,
        padding: '2rem 1.5rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: '960px' }}>
          {view === 'setup'   && <Setup />}
          {view === 'draft'   && <Draft />}
          {view === 'bracket' && <Bracket />}
          {view === 'control' && <Control />}
        </div>
      </main>
    </div>
  )
}
