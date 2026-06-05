import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { Timer } from '../../../src/renderer/components/Timer'

vi.useFakeTimers()
afterEach(() => vi.clearAllTimers())

const noop = (): void => {}

function renderTimer(overrides: Partial<React.ComponentProps<typeof Timer>> = {}): void {
  render(
    <Timer
      durationSeconds={60}
      remainingSeconds={60}
      running={false}
      onDurationChange={noop}
      onToggle={noop}
      onReset={noop}
      onTick={noop}
      onExpire={noop}
      {...overrides}
    />
  )
}

describe('Timer', () => {
  it('displays remainingSeconds formatted as M:SS', () => {
    renderTimer({ remainingSeconds: 90, durationSeconds: 90 })
    expect(screen.getByText('1:30')).toBeInTheDocument()
  })

  it('calls onTick each second when running', () => {
    const onTick = vi.fn()
    renderTimer({ running: true, onTick })
    act(() => vi.advanceTimersByTime(3000))
    expect(onTick).toHaveBeenCalledTimes(3)
  })

  it('calls onExpire once when remainingSeconds is 0', () => {
    const onExpire = vi.fn()
    renderTimer({ remainingSeconds: 0, onExpire })
    expect(onExpire).toHaveBeenCalledOnce()
  })

  it('does not call onExpire again on re-render while still at 0', () => {
    const onExpire = vi.fn()
    const { rerender } = render(
      <Timer
        durationSeconds={60}
        remainingSeconds={0}
        running={false}
        onDurationChange={noop}
        onToggle={noop}
        onReset={noop}
        onTick={noop}
        onExpire={onExpire}
      />
    )
    rerender(
      <Timer
        durationSeconds={60}
        remainingSeconds={0}
        running={false}
        onDurationChange={noop}
        onToggle={noop}
        onReset={noop}
        onTick={noop}
        onExpire={onExpire}
      />
    )
    expect(onExpire).toHaveBeenCalledOnce()
  })

  it('calls onReset when Reset button clicked', () => {
    const onReset = vi.fn()
    renderTimer({ onReset })
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('calls onToggle when Start button clicked', () => {
    const onToggle = vi.fn()
    renderTimer({ running: false, onToggle })
    fireEvent.click(screen.getByRole('button', { name: /start/i }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('shows Pause label when running', () => {
    renderTimer({ running: true })
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
  })
})
