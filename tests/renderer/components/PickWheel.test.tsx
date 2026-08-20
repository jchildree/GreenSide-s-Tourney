import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, createEvent } from '@testing-library/react'
import { PickWheel } from '../../../src/renderer/components/PickWheel'

const PLAYERS = ['Alice', 'Bob', 'Carol', 'Dave']

function labelOrder(): string[] {
  return screen.getAllByTestId('wheel-label').map((el) => el.textContent ?? '')
}

// jsdom builds transitionend as a plain Event, dropping the propertyName init,
// so set it explicitly for the component's transform-only completion guard.
function fireTransformEnd(el: Element): void {
  const ev = createEvent.transitionEnd(el)
  Object.defineProperty(ev, 'propertyName', { value: 'transform' })
  fireEvent(el, ev)
}

describe('PickWheel', () => {
  it('renders one wedge path per player', () => {
    render(<PickWheel players={PLAYERS} onSpinComplete={() => {}} />)
    expect(screen.getAllByTestId('wheel-wedge')).toHaveLength(4)
  })

  it('renders distinct wedges for duplicate player names', () => {
    render(
      <PickWheel players={['Luffy', 'Luffy', 'Zoro', 'Nami']} onSpinComplete={() => {}} />
    )
    expect(screen.getAllByTestId('wheel-wedge')).toHaveLength(4)
  })

  it('shows the empty state when no players remain', () => {
    render(<PickWheel players={[]} onSpinComplete={() => {}} />)
    expect(screen.getByText('All drafted!')).toBeInTheDocument()
  })

  it('renders the "X left" badge', () => {
    render(<PickWheel players={PLAYERS} onSpinComplete={() => {}} />)
    expect(screen.getByText('4 left')).toBeInTheDocument()
  })

  it('fires onSpinStart on spin and onSpinComplete with a player on transition end', () => {
    const onSpinStart = vi.fn()
    const onSpinComplete = vi.fn()
    render(
      <PickWheel players={PLAYERS} onSpinComplete={onSpinComplete} onSpinStart={onSpinStart} />
    )

    vi.useFakeTimers()
    fireEvent.click(screen.getByTestId('spin-wheel'))
    expect(onSpinStart).toHaveBeenCalledOnce()

    fireTransformEnd(screen.getByTestId('wheel-rotor'))
    vi.runAllTimers()
    expect(onSpinComplete).toHaveBeenCalledOnce()
    expect(PLAYERS).toContain(onSpinComplete.mock.calls[0][0])
    vi.useRealTimers()
  })

  it('does not double-fire onSpinComplete on a second transition end', () => {
    const onSpinComplete = vi.fn()
    render(<PickWheel players={PLAYERS} onSpinComplete={onSpinComplete} />)

    vi.useFakeTimers()
    fireEvent.click(screen.getByTestId('spin-wheel'))
    fireTransformEnd(screen.getByTestId('wheel-rotor'))
    fireTransformEnd(screen.getByTestId('wheel-rotor'))
    vi.runAllTimers()
    expect(onSpinComplete).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('lands the winner under the top caret on every spin, not just the first', () => {
    // Winner index 1 of 4 -> wedge mid at 90 + 45 = 135deg; expected rest angle 360-135=225.
    vi.spyOn(Math, 'random').mockReturnValue(0.3)
    render(<PickWheel players={PLAYERS} onSpinComplete={() => {}} />)
    const rotor = screen.getByTestId('wheel-rotor')
    const restAngle = (): number => {
      const m = /rotate\(([-\d.]+)deg\)/.exec(rotor.style.transform)
      const deg = m ? parseFloat(m[1]) : 0
      return ((deg % 360) + 360) % 360
    }

    fireEvent.click(screen.getByTestId('spin-wheel'))
    expect(restAngle()).toBeCloseTo(225, 1)
    fireTransformEnd(rotor)

    fireEvent.click(screen.getByTestId('spin-wheel'))
    expect(restAngle()).toBeCloseTo(225, 1)
    vi.restoreAllMocks()
  })

  it('Shuffle changes the wedge order', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<PickWheel players={PLAYERS} onSpinComplete={() => {}} />)
    const before = labelOrder()

    fireEvent.click(screen.getByTestId('shuffle-wheel'))
    const after = labelOrder()

    expect(after).not.toEqual(before)
    expect([...after].sort()).toEqual([...before].sort())
    vi.restoreAllMocks()
  })
})
