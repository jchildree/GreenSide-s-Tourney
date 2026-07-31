import { useEffect, useRef, useState } from 'react'
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

/**
 * Same behaviour as before — click the clock to type a time, slider or number
 * box for the per-pick duration. Only the type sizes and labels changed, so the
 * controls are readable across the room on draft night.
 */
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

  useEffect(() => {
    if (remainingSeconds > 0) expiredFired.current = false
  }, [remainingSeconds])

  const remainingRef = useRef(remainingSeconds)
  useEffect(() => { remainingRef.current = remainingSeconds }, [remainingSeconds])

  const onTickRef = useRef(onTick)
  useEffect(() => { onTickRef.current = onTick }, [onTick])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      onTickRef.current(Math.max(0, remainingRef.current - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (isExpired && !expiredFired.current) {
      expiredFired.current = true
      playBeep()
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } })
      } catch (_) { /* confetti unavailable in tests */ }
      onExpire()
    }
  }, [isExpired, onExpire])

  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef(false)

  const parseTime = (s: string): number | null => {
    const colonMatch = s.match(/^(\d+):(\d{1,2})$/)
    if (colonMatch) {
      const parsed = parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10)
      return Math.min(3600, Math.max(10, parsed))
    }
    if (/^\d+$/.test(s)) return Math.min(3600, Math.max(10, parseInt(s, 10)))
    return null
  }

  const enterEdit = (): void => {
    if (running) onToggle()
    setEditVal(format(remainingSeconds))
    setEditing(true)
  }

  const commitEdit = (): void => {
    if (cancelRef.current) { cancelRef.current = false; return }
    const parsed = parseTime(editVal)
    if (parsed !== null) onDurationChange(parsed)
    setEditing(false)
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const clampDuration = (v: number): number => Math.min(3600, Math.max(10, v))

  const clockStyle = {
    fontFamily: 'ui-monospace, monospace',
    fontSize: '3rem',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums' as const,
    letterSpacing: '-0.02em',
    color: isExpired ? 'var(--color-danger)' : 'var(--color-primary)',
    lineHeight: 1,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') { cancelRef.current = true; setEditing(false) }
          }}
          aria-label="Pick time"
          style={{ ...clockStyle, border: 'none', background: 'transparent', outline: 'none', textAlign: 'center', width: '5ch', padding: 0 }}
        />
      ) : (
        <button
          onClick={enterEdit}
          title="Click to type a time"
          style={{ ...clockStyle, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, transition: 'color 300ms ease' }}
        >
          {format(remainingSeconds)}
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label htmlFor="pick-seconds" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-silver)' }}>
          Seconds per pick
        </label>
        <input
          type="range"
          min={10}
          max={3600}
          step={1}
          value={durationSeconds}
          onChange={e => onDurationChange(clampDuration(Number(e.target.value)))}
          aria-label="Seconds per pick"
          style={{ width: '7rem', accentColor: 'var(--color-primary)' }}
        />
        <input
          id="pick-seconds"
          type="number"
          min={10}
          max={3600}
          value={durationSeconds}
          onChange={e => onDurationChange(clampDuration(Number(e.target.value)))}
          style={{
            width: '4.25rem',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-primary)',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.95rem',
            textAlign: 'center',
            borderRadius: '0.4rem',
            padding: '0.3rem 0.4rem',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[
          { label: running ? 'Pause' : 'Start', onClick: onToggle },
          { label: 'Reset', onClick: onReset },
        ].map(b => (
          <button
            key={b.label}
            onClick={b.onClick}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '0.45rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              color: 'var(--color-silver)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
            }}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  )
}
