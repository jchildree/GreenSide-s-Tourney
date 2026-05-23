import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timer } from '../../../src/renderer/components/Timer'

vi.useFakeTimers()

afterEach(() => vi.clearAllTimers())

describe('Timer', () => {
  it('displays initial time', () => {
    render(<Timer initialSeconds={90} />)
    expect(screen.getByText('1:30')).toBeInTheDocument()
  })

  it('counts down each second', () => {
    render(<Timer initialSeconds={5} />)
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('0:04')).toBeInTheDocument()
  })

  it('stops at 0:00', () => {
    render(<Timer initialSeconds={2} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('resets to initial on reset button click', async () => {
    vi.useRealTimers()
    try {
      render(<Timer initialSeconds={10} />)
      await new Promise(resolve => setTimeout(resolve, 100))
      await userEvent.click(screen.getByRole('button', { name: /reset/i }))
      expect(screen.getByText('0:10')).toBeInTheDocument()
    } finally {
      vi.useFakeTimers()
    }
  })
})
