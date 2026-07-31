import type { CSSProperties } from 'react'
import type { Progress, StepId } from '../hooks/useTournamentProgress'

interface HomeProps {
  progress: Progress
  onNavigate: (id: StepId) => void
}

function formatWhen(iso: string): string {
  if (!iso) return 'date not set'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'date not set'
  return `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}

const PRIMARY_BUTTON: CSSProperties = {
  padding: '0.75rem 1.6rem',
  borderRadius: '0.6rem',
  fontWeight: 700,
  fontSize: '0.95rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: 'var(--color-bg)',
  background: 'linear-gradient(160deg, var(--color-bright, var(--color-primary)) 0%, var(--color-primary) 45%, var(--color-deep, var(--color-primary)) 100%)',
  border: '1px solid var(--color-deep, var(--color-primary))',
  boxShadow: '0 0 18px rgba(var(--glow-rgb), 0.45)',
}

export function Home({ progress, onNavigate }: HomeProps): JSX.Element {
  const { steps, next, tourney } = progress

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.625rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
          {tourney.name || 'New tournament'}
        </h2>
        <span style={{ fontSize: '0.95rem', color: 'var(--color-muted)' }}>
          {(tourney.game || 'game not set')} · {formatWhen(tourney.dateTime)}
        </span>
      </div>
      <p style={{ margin: '0.5rem 0 1.6rem', fontSize: '1rem', color: 'var(--color-silver)', textWrap: 'pretty' }}>
        Follow the steps below — the console walks you through the whole tournament, start to finish.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1rem' }}>
        {steps.map((s, i) => {
          const isNext = s.id === next.id && !s.done
          const status = s.done ? 'Done' : isNext ? 'Up next' : 'Waiting'
          const statusColor = s.done ? 'var(--color-primary)' : isNext ? 'var(--color-gold)' : 'var(--color-muted)'
          return (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id)}
              data-testid={`home-card-${s.id}`}
              style={{
                background: 'var(--color-card)',
                border: '1px solid',
                borderColor: isNext ? 'rgba(var(--glow-rgb), 0.5)' : 'var(--color-border)',
                borderRadius: '0.85rem',
                padding: '1.25rem 1.375rem',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isNext ? '0 0 18px rgba(var(--glow-rgb), 0.25)' : 'none',
                transition: 'border-color 150ms ease, box-shadow 150ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isNext ? 'rgba(var(--glow-rgb), 0.5)' : 'var(--color-border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{
                  width: '1.875rem',
                  height: '1.875rem',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  background: s.done ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: s.done ? 'var(--color-bg)' : 'var(--color-silver)',
                  border: s.done ? 'none' : '1px solid var(--color-border)',
                }}>
                  {s.done ? '✓' : i + 1}
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)' }}>{s.label}</span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: statusColor,
                }}>
                  {status}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>{s.desc}</p>
            </button>
          )
        })}
      </div>

      <div style={{
        marginTop: '1.375rem',
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.85rem',
        padding: '1.125rem 1.375rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <span aria-hidden style={{ fontSize: '1.6rem' }}>→</span>
        <div style={{ flex: 1, minWidth: '14rem' }}>
          <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-bright, var(--color-primary))' }}>
            Next up: {next.label}
          </p>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-muted)' }}>{next.desc}</p>
        </div>
        <button
          data-testid="home-continue"
          onClick={() => onNavigate(next.id)}
          style={PRIMARY_BUTTON}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
