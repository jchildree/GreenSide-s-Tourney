import { useState } from 'react'

interface PickWheelProps {
  players: string[]
  onPick: (name: string) => void
}

export function PickWheel({ players, onPick }: PickWheelProps): JSX.Element {
  const [spinning, setSpinning] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const empty = players.length === 0

  function spin(): void {
    if (empty || spinning) return
    setSpinning(true)
    setPicked(null)

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
        onPick(winner)
      }
    }, 80)
  }

  const displayColor = spinning
    ? 'var(--color-gold)'
    : picked
      ? 'var(--color-text)'
      : 'var(--color-muted)'

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
      <div style={{
        fontSize: '1.75rem',
        fontWeight: 700,
        minHeight: '2.5rem',
        letterSpacing: '0.05em',
        color: displayColor,
        transition: 'color 75ms ease',
        textAlign: 'center',
      }}>
        {picked ?? (empty ? 'No players left' : '—')}
      </div>

      <button onClick={spin} disabled={spinning || empty} className="btn-gold" style={{ padding: '0.5rem 2rem', letterSpacing: '0.15em' }}>
        {spinning ? 'Spinning…' : 'Spin'}
      </button>

      {!empty && (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
          {players.length} player{players.length !== 1 ? 's' : ''} remaining
        </p>
      )}
    </div>
  )
}
