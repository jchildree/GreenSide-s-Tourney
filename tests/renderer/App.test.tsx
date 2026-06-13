import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from '../../src/renderer/App'

vi.mock('../../src/renderer/views/Setup', () => ({ Setup: () => <div data-testid="setup" /> }))
vi.mock('../../src/renderer/views/Draft', () => ({ Draft: () => <div /> }))
vi.mock('../../src/renderer/views/Bracket', () => ({ Bracket: () => <div /> }))
vi.mock('../../src/renderer/views/Control', () => ({ Control: () => <div /> }))
vi.mock('../../src/renderer/views/Settings', () => ({ Settings: () => <div /> }))
vi.mock('../../src/renderer/views/Matches', () => ({ Matches: () => <div /> }))
vi.mock('../../src/renderer/views/Onboarding', () => ({ Onboarding: () => <div /> }))

beforeEach(() => {
  window.api = {
    checkOnboarding: vi.fn().mockResolvedValue({ complete: true }),
    getAppearance: vi.fn().mockResolvedValue({ theme: 'green', backgroundDataUrl: null }),
  } as unknown as typeof window.api
})

describe('App header', () => {
  it('shows "The Colosseum" as the app name', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { level: 1, name: /the colosseum/i })).toBeInTheDocument()
  })

  it('keeps the "Tournament Dashboard" subtitle', async () => {
    render(<App />)
    expect(await screen.findByText('Tournament Dashboard')).toBeInTheDocument()
  })
})
