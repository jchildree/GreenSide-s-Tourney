import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamRoster } from '../../../src/renderer/components/TeamRoster'

describe('TeamRoster', () => {
  it('renders team names', () => {
    render(<TeamRoster teams={[{ name: 'Alpha', players: ['Alice', 'Bob'] }]} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    render(<TeamRoster teams={[]} />)
    expect(screen.getByText(/no teams/i)).toBeInTheDocument()
  })
})
