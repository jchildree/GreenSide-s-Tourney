import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface TimerProps {
  durationSeconds: number
  remainingSeconds: number
  running: boolean
  onDurationChange: (s: number) => void
  onToggle: () => void
  onReset: () => void
  onTick: (remaining: number) => void
  onExpire: () => void
}

function format(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function playBeep(): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = 440
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch {
    // audio not available in test environments
  }
}

export function Timer({
  durationSeconds,
  remainingSeconds,
  running,
  onDurationChange,
  onToggle,
  onReset,
  onTick,
  onExpire,
}: TimerProps): JSX.Element {
  const expiredFired = useRef(false)
  const isExpired = remainingSeconds === 0

  // Reset the expiredFired guard when the timer is reset (remaining goes back up)
  useEffect(() => {
    if (remainingSeconds > 0) {
      expiredFired.current = false
    }
  }, [remainingSeconds])

  const remainingRef = useRef(remainingSeconds)
  useEffect(() => { remainingRef.current = remainingSeconds }, [remainingSeconds])

  const onTickRef = useRef(onTick)
  useEffect(() => { onTickRef.current = onTick }, [onTick])

  // Interval tick
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      onTickRef.current(Math.max(0, remainingRef.current - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  // Expire side-effects
  useEffect(() => {
    if (isExpired && !expiredFired.current) {
      expiredFired.current = true
      playBeep()
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } })
      } catch (_) {}
      onExpire()
    }
  }, [isExpired, onExpire])

  const clampDuration = (v: number): number => Math.min(3600, Math.max(10, v))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
      {/* Countdown display */}
      <span style={{
        fontFamily: 'monospace',
        fontSize: '3rem',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        color: isExpired ? 'var(--color-danger)' : 'var(--color-primary)',
        transition: 'color 300ms ease',
      }}>
        {format(remainingSeconds)}
      </span>

      {/* Duration controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--color-primary)', opacity: 0.7 }}>
          DURATION
        </label>
        <input
          type="range"
          min={10}
          max={3600}
          step={1}
          value={durationSeconds}
          onChange={e => onDurationChange(clampDuration(Number(e.target.value)))}
          style={{ width: '8rem', accentColor: 'var(--color-primary)' }}
        />
        <input
          type="number"
          min={10}
          max={3600}
          value={durationSeconds}
          onChange={e => onDurationChange(clampDuration(Number(e.target.value)))}
          style={{
            width: '4rem',
            background: 'transparent',
            border: '1px solid rgba(200,169,110,0.4)',
            color: 'var(--color-primary)',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            textAlign: 'center',
            borderRadius: '4px',
            padding: '2px 4px',
          }}
        />
        <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', opacity: 0.5 }}>s</span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn-ghost"
          onClick={onToggle}
          style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          className="btn-ghost"
          onClick={onReset}
          style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
