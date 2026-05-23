import { useState, useEffect, useRef } from 'react'

interface TimerProps {
  initialSeconds: number
}

function format(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function Timer({ initialSeconds }: TimerProps): JSX.Element {
  const [remaining, setRemaining] = useState(initialSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isExpired = remaining === 0

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(r => (r > 0 ? r - 1 : 0))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function reset(): void {
    setRemaining(initialSeconds)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <span style={{
        fontFamily: 'monospace',
        fontSize: '3rem',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        color: isExpired ? 'var(--color-danger)' : 'var(--color-gold)',
        transition: 'color 300ms ease',
      }}>
        {format(remaining)}
      </span>
      <button onClick={reset} className="btn-ghost" style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}>
        Reset
      </button>
    </div>
  )
}
