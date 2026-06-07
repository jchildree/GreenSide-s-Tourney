import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from '../../../src/renderer/views/Settings'

beforeEach(() => {
  window.api = {
    getCredential: vi.fn().mockResolvedValue(null),
    beginGoogleOAuth: vi.fn().mockResolvedValue(undefined),
    beginChallongeOAuth: vi.fn().mockResolvedValue(undefined),
    disconnectGoogle: vi.fn().mockResolvedValue(undefined),
    disconnectChallonge: vi.fn().mockResolvedValue(undefined),
    getTourney: vi.fn().mockResolvedValue({}),
    saveTourney: vi.fn().mockResolvedValue(undefined),
    getSignups: vi.fn().mockResolvedValue([]),
    fetchSignups: vi.fn().mockResolvedValue([]),
    getDraft: vi.fn().mockResolvedValue({ teams: [], pickOrder: [] }),
    saveDraft: vi.fn().mockResolvedValue(undefined),
    getSync: vi.fn().mockResolvedValue({ challongeLastPushed: null, challongeTournamentId: null, googleFormLastUpdated: null }),
    updateGoogleForm: vi.fn().mockResolvedValue(undefined),
    pushToChallonge: vi.fn().mockResolvedValue(undefined),
    saveCredential: vi.fn().mockResolvedValue(undefined),
  } as typeof window.api
})

describe('Settings view', () => {
  it('shows "Not connected" for both services when credentials are absent', async () => {
    ;(window.api.getCredential as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    render(<Settings />)
    await waitFor(() => {
      expect(screen.getAllByText(/not connected/i).length).toBeGreaterThanOrEqual(2)
    })
  })

  it('shows "Connected" for Google when google credential is present', async () => {
    ;(window.api.getCredential as ReturnType<typeof vi.fn>).mockImplementation(
      async (service: string) => (service === 'google' ? 'token' : null)
    )
    render(<Settings />)
    await waitFor(() => {
      expect(screen.getByTestId('google-status')).toHaveTextContent(/connected/i)
    })
  })

  it('calls beginGoogleOAuth when Google Connect button is clicked', async () => {
    render(<Settings />)
    await waitFor(() => screen.getAllByText(/not connected/i))
    const connectBtns = screen.getAllByRole('button', { name: /connect/i })
    await userEvent.click(connectBtns[0])
    expect(window.api.beginGoogleOAuth).toHaveBeenCalled()
  })
})
