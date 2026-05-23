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
    <div>
      <span style={{ fontSize: '2rem', fontVariantNumeric: 'tabular-nums' }}>
        {format(remaining)}
      </span>
      <button onClick={reset} style={{ marginLeft: '1rem' }}>Reset</button>
    </div>
  )
}
