import { useState } from 'react'

interface PickWheelProps {
  players: string[]
  onPick: (name: string) => void
}

export function PickWheel({ players, onPick }: PickWheelProps): JSX.Element {
  const [spinning, setSpinning] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)

  function spin(): void {
    if (players.length === 0 || spinning) return
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

  return (
    <div style={{ margin: '1rem 0' }}>
      <div style={{ fontSize: '1.5rem', minHeight: '2rem', fontWeight: 'bold' }}>
        {picked ?? (players.length === 0 ? 'No players left' : '—')}
      </div>
      <button onClick={spin} disabled={spinning || players.length === 0}>
        {spinning ? 'Spinning…' : 'Spin'}
      </button>
    </div>
  )
}
