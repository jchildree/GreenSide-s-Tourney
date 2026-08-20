import type { CSSProperties } from 'react'
import type { Step, StepId } from '../hooks/useTournamentProgress'

export type View = StepId | 'home' | 'money' | 'settings'

interface SidebarProps {
  view: View
  steps: Step[]
  onNavigate: (v: View) => void
  googleConnected: boolean | null
  challongeConnected: boolean | null
}

function navItemStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    width: '100%',
    minHeight: '2.5rem',
    padding: '0.7rem 0.75rem',
    borderRadius: '0.65rem',
    border: '1px solid',
    borderColor: active ? 'var(--color-border)' : 'transparent',
    background: active
      ? 'linear-gradient(160deg, var(--color-card) 0%, var(--color-surface) 100%)'
      : 'transparent',
    color: active ? 'var(--color-bright, var(--color-primary))' : 'var(--color-muted)',
    fontSize: '0.97rem',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    boxSizing: 'border-box',
    transition: 'color 150ms ease, background 150ms ease, border-color 150ms ease',
  }
}

function badgeStyle(done: boolean): CSSProperties {
  return {
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
    flexShrink: 0,
    background: done ? 'var(--color-primary)' : 'var(--color-card)',
    color: done ? 'var(--color-bg)' : 'var(--color-muted)',
    border: done ? 'none' : '1px solid var(--color-border)',
  }
}

function StatusDot({ on }: { on: boolean | null }): JSX.Element {
  return (
    <span
      aria-hidden
      style={{
        width: '0.55rem',
        height: '0.55rem',
        borderRadius: '50%',
        flexShrink: 0,
        background: on ? 'var(--color-primary)' : 'var(--color-border)',
        boxShadow: on ? '0 0 6px rgba(var(--glow-rgb), 0.6)' : 'none',
      }}
    />
  )
}

export function Sidebar({ view, steps, onNavigate, googleConnected, challongeConnected }: SidebarProps): JSX.Element {
  function item(id: View, label: string, icon: string): JSX.Element {
    const active = view === id
    return (
      <button
        onClick={() => onNavigate(id)}
        style={navItemStyle(active)}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--color-card)'; e.currentTarget.style.color = 'var(--color-text)' } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted)' } }}
      >
        <span style={{ fontSize: '1.05rem' }}>{icon}</span>
        <span>{label}</span>
      </button>
    )
  }

  return (
    <aside
      style={{
        width: '15.5rem',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        padding: '1.25rem 0.875rem',
        boxSizing: 'border-box',
        height: '100vh',
      }}
    >
      <div style={{ padding: '0.35rem 0.625rem 1.15rem' }}>
        <h1 style={{
          margin: 0,
          color: 'var(--color-primary)',
          fontWeight: 700,
          fontSize: '1.25rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          The Colosseum
        </h1>
        <p style={{ margin: '0.3rem 0 0', color: 'var(--color-muted)', fontSize: '0.78rem', letterSpacing: '0.1em' }}>
          TOURNAMENT CONSOLE
        </p>
      </div>

      {item('home', 'Home', '⌂')}

      <p style={{
        margin: 0,
        padding: '0.875rem 0.625rem 0.375rem',
        color: 'var(--color-muted)',
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>
        Run a tournament
      </p>

      {steps.map((s, i) => {
        const active = view === s.id
        return (
          <button
            key={s.id}
            onClick={() => onNavigate(s.id)}
            data-testid={`nav-${s.id}`}
            style={navItemStyle(active)}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--color-card)'; e.currentTarget.style.color = 'var(--color-text)' } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted)' } }}
          >
            <span style={badgeStyle(s.done)}>{s.done ? '✓' : i + 1}</span>
            <span style={{ flex: 1 }}>{s.label}</span>
          </button>
        )
      })}

      <div style={{ flex: 1 }} />

      {item('money', 'Money', '$')}
      {item('settings', 'Settings', '⚙')}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 0.625rem 0.125rem' }}>
        <StatusDot on={googleConnected} />
        <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>Google</span>
        <StatusDot on={challongeConnected} />
        <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>Challonge</span>
      </div>
    </aside>
  )
}
