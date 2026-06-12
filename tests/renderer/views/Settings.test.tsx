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
    clearTournament: vi.fn().mockResolvedValue(undefined),
    getAppearance: vi.fn().mockResolvedValue({ theme: 'green', backgroundDataUrl: null }),
    setTheme: vi.fn().mockResolvedValue(undefined),
    chooseBackground: vi.fn().mockResolvedValue('data:image/png;base64,abc'),
    removeBackground: vi.fn().mockResolvedValue(undefined),
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

  it('shows confirm step before clearing tournament data', async () => {
    render(<Settings />)
    await userEvent.click(screen.getByTestId('clear-tournament'))
    expect(screen.getByTestId('confirm-clear')).toBeInTheDocument()
    expect(window.api.clearTournament).not.toHaveBeenCalled()
  })

  it('clears tournament data and fires onCleared on confirm', async () => {
    const onCleared = vi.fn()
    render(<Settings onCleared={onCleared} />)
    await userEvent.click(screen.getByTestId('clear-tournament'))
    await userEvent.click(screen.getByTestId('confirm-clear'))
    await waitFor(() => {
      expect(window.api.clearTournament).toHaveBeenCalled()
      expect(onCleared).toHaveBeenCalled()
    })
  })

  it('cancel hides confirm step without clearing', async () => {
    render(<Settings />)
    await userEvent.click(screen.getByTestId('clear-tournament'))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByTestId('confirm-clear')).not.toBeInTheDocument()
    expect(window.api.clearTournament).not.toHaveBeenCalled()
  })

  it('renders five theme swatches and calls setTheme + onThemeChange on click', async () => {
    const onThemeChange = vi.fn()
    render(<Settings theme="green" onThemeChange={onThemeChange} backgroundSet={false} onBackgroundChange={vi.fn()} />)
    const swatches = screen.getAllByTestId(/^theme-swatch-/)
    expect(swatches).toHaveLength(5)
    await userEvent.click(screen.getByTestId('theme-swatch-crimson'))
    await waitFor(() => {
      expect(window.api.setTheme).toHaveBeenCalledWith('crimson')
      expect(onThemeChange).toHaveBeenCalledWith('crimson')
    })
  })

  it('choose background calls api and reports data url upward', async () => {
    const onBackgroundChange = vi.fn()
    render(<Settings theme="green" onThemeChange={vi.fn()} backgroundSet={false} onBackgroundChange={onBackgroundChange} />)
    await userEvent.click(screen.getByTestId('choose-background'))
    await waitFor(() => {
      expect(window.api.chooseBackground).toHaveBeenCalled()
      expect(onBackgroundChange).toHaveBeenCalledWith('data:image/png;base64,abc')
    })
  })

  it('remove background calls api and clears upward', async () => {
    const onBackgroundChange = vi.fn()
    render(<Settings theme="green" onThemeChange={vi.fn()} backgroundSet={true} onBackgroundChange={onBackgroundChange} />)
    await userEvent.click(screen.getByTestId('remove-background'))
    await waitFor(() => {
      expect(window.api.removeBackground).toHaveBeenCalled()
      expect(onBackgroundChange).toHaveBeenCalledWith(null)
    })
  })
})
