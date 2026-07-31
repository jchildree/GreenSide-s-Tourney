import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from '../../src/renderer/App'

vi.mock('../../src/renderer/views/Home', () => ({ Home: () => <div data-testid="home" /> }))
vi.mock('../../src/renderer/views/Setup', () => ({ Setup: () => <div /> }))
vi.mock('../../src/renderer/views/Signups', () => ({ Signups: () => <div /> }))
vi.mock('../../src/renderer/views/Draft', () => ({ Draft: () => <div /> }))
vi.mock('../../src/renderer/views/Bracket', () => ({ Bracket: () => <div /> }))
vi.mock('../../src/renderer/views/Matches', () => ({ Matches: () => <div /> }))
vi.mock('../../src/renderer/views/Settings', () => ({ Settings: () => <div /> }))
vi.mock('../../src/renderer/views/Onboarding', () => ({ Onboarding: () => <div /> }))
vi.mock('../../src/renderer/components/Sidebar', () => ({ Sidebar: () => <nav data-testid="sidebar" /> }))
vi.mock('../../src/renderer/hooks/useTournamentProgress', () => ({
  useTournamentProgress: () => ({ steps: [], reload: vi.fn() }),
}))

beforeEach(() => {
  window.api = {
    checkOnboarding: vi.fn().mockResolvedValue({ complete: true }),
    getAppearance: vi.fn().mockResolvedValue({ theme: 'green', backgroundDataUrl: null, backgroundOpacity: 35 }),
    getCredential: vi.fn().mockResolvedValue(null),
  } as unknown as typeof window.api
})

describe('App shell', () => {
  it('renders the sidebar', async () => {
    render(<App />)
    expect(await screen.findByTestId('sidebar')).toBeInTheDocument()
  })

  it('shows the home view by default', async () => {
    render(<App />)
    expect(await screen.findByTestId('home')).toBeInTheDocument()
  })
})
