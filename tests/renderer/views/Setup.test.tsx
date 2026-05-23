import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Setup } from '../../../src/renderer/views/Setup'

const mockTourney = {
  name: 'Test Cup', game: 'Minecraft', dateTime: '2026-06-01T18:00',
  signupDeadline: '2026-05-31T18:00', draftStyle: 'random' as const, minPlayers: 4, maxPlayers: 16
}

beforeEach(() => {
  window.api = {
    getTourney: vi.fn().mockResolvedValue(mockTourney),
    saveTourney: vi.fn().mockResolvedValue(undefined),
    getSignups: vi.fn().mockResolvedValue([]),
    fetchSignups: vi.fn().mockResolvedValue([]),
    getDraft: vi.fn().mockResolvedValue({ teams: [], pickOrder: [] }),
    saveDraft: vi.fn().mockResolvedValue(undefined),
    getSync: vi.fn().mockResolvedValue({ challongeLastPushed: null, challongeTournamentId: null, googleFormLastUpdated: null }),
    updateGoogleForm: vi.fn().mockResolvedValue(undefined),
    pushToChallonge: vi.fn().mockResolvedValue(undefined),
    getCredential: vi.fn().mockResolvedValue(null),
    saveCredential: vi.fn().mockResolvedValue(undefined)
  } as typeof window.api
})

describe('Setup view', () => {
  it('loads and displays tourney name', async () => {
    render(<Setup />)
    await waitFor(() => expect(screen.getByDisplayValue('Test Cup')).toBeInTheDocument())
  })

  it('calls saveTourney on form submit', async () => {
    render(<Setup />)
    await waitFor(() => screen.getByDisplayValue('Test Cup'))
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(window.api.saveTourney).toHaveBeenCalled()
  })
})
