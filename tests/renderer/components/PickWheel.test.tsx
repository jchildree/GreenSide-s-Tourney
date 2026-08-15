import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PickWheel } from '../../../src/renderer/components/PickWheel'

const PLAYERS = ['Alice', 'Bob', 'Carol', 'Dave']

function labelOrder(): string[] {
  return screen.getAllByTestId('wheel-label').map((el) => el.textContent ?? '')
}

describe('PickWheel', () => {
  it('renders one wedge path per player', () => {
    render(<PickWheel players={PLAYERS} onSpinComplete={() => {}} />)
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

    fireEvent.click(screen.getByTestId('spin-wheel'))
    expect(onSpinStart).toHaveBeenCalledOnce()

    fireEvent.transitionEnd(screen.getByTestId('wheel-rotor'))
    expect(onSpinComplete).toHaveBeenCalledOnce()
    expect(PLAYERS).toContain(onSpinComplete.mock.calls[0][0])
  })

  it('does not double-fire onSpinComplete on a second transition end', () => {
    const onSpinComplete = vi.fn()
    render(<PickWheel players={PLAYERS} onSpinComplete={onSpinComplete} />)

    fireEvent.click(screen.getByTestId('spin-wheel'))
    fireEvent.transitionEnd(screen.getByTestId('wheel-rotor'))
    fireEvent.transitionEnd(screen.getByTestId('wheel-rotor'))
    expect(onSpinComplete).toHaveBeenCalledOnce()
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
