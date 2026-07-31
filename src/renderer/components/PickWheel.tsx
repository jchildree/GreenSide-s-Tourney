import { useState } from 'react'

interface PickWheelProps {
  players: string[]
  onSpinComplete: (name: string) => void
  onSpinStart?: () => void
}

/**
 * Restyled as a compact inline strip so it sits comfortably in the draft
 * control bar. Spin logic is unchanged.
 */
export function PickWheel({ players, onSpinComplete, onSpinStart }: PickWheelProps): JSX.Element {
  const [spinning, setSpinning] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const empty = players.length === 0

  function spin(): void {
    if (empty || spinning) return
    setSpinning(true)
    setPicked(null)
    onSpinStart?.()

    let ticks = 0
    const total = 20 + Math.floor(Math.random() * 10)

    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * players.length)
      setPicked(players[idx])
      ticks++
      if (ticks >= total) {
        clearInterval(interval)
        const winner = players[Math.floor(Math.random() * players.length)]
        setPicked(winner)
        setSpinning(false)
        onSpinComplete(winner)
      }
    }, 80)
  }

  const displayColor = spinning
    ? 'var(--color-gold)'
    : picked
      ? 'var(--color-bright, var(--color-primary))'
      : 'var(--color-muted)'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.875rem',
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '0.7rem',
      padding: '0.5rem 0.75rem 0.5rem 1rem',
    }}>
      <span style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: displayColor,
        transition: 'color 75ms ease',
        minWidth: '9rem',
      }}>
        {picked ?? (empty ? 'All drafted!' : '— spin —')}
      </span>

      <button
        onClick={spin}
        disabled={spinning || empty}
        data-testid="spin-wheel"
        style={{
          padding: '0.6rem 1.5rem',
          borderRadius: '0.55rem',
          fontWeight: 700,
          fontSize: '0.9rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: spinning || empty ? 'default' : 'pointer',
          color: 'var(--color-bg)',
          background: 'linear-gradient(160deg, var(--color-bright, var(--color-primary)) 0%, var(--color-primary) 45%, var(--color-deep, var(--color-primary)) 100%)',
          border: '1px solid var(--color-deep, var(--color-primary))',
          boxShadow: '0 0 14px rgba(var(--glow-rgb), 0.4)',
          opacity: spinning || empty ? 0.4 : 1,
        }}
      >
        {spinning ? 'Spinning…' : 'Spin'}
      </button>

      {!empty && (
        <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
          {players.length} left
        </span>
      )}
    </div>
  )
}
