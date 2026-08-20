import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock ipcMain before importing ipc.ts
const handlers: Record<string, (event: unknown, ...args: unknown[]) => unknown> = {}
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, fn: (e: unknown, ...a: unknown[]) => unknown) => {
      handlers[channel] = fn
    })
  }
}))

vi.mock('../../src/main/store', () => ({
  readTourney: vi.fn(() => ({ name: 'Mock Cup', game: '', dateTime: '', signupDeadline: '', draftStyle: 'random', eliminationType: 'single', maps: [], rules: '', minPlayers: 2, maxPlayers: 32, teamNames: [], teamSize: 4, streamLink: '', enabledFields: {} })),
  saveTourney: vi.fn(),
  readSignups: vi.fn(() => []),
  saveSignups: vi.fn(),
  readDraft: vi.fn(() => ({ teams: [], pickOrder: [] })),
  saveDraft: vi.fn(),
  readSync: vi.fn(() => ({ challongeLastPushed: null, challongeTournamentId: null, googleFormId: null, googleFormLastUpdated: null, tournamentStartedAt: null })),
  saveSync: vi.fn(),
  clearTournamentData: vi.fn(),
  readConfig: vi.fn(() => ({ challongeCommunityUrl: '', theme: 'green', backgroundImage: null })),
  saveConfig: vi.fn(),
}))

vi.mock('../../src/main/keychain', () => ({
  getCredential: vi.fn(() => 'mock-cred'),
  saveCredential: vi.fn(),
  deleteCredential: vi.fn(),
}))

vi.mock('../../src/main/auth/oauth-config', () => ({
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  CHALLONGE_CLIENT_ID: '',
  CHALLONGE_CLIENT_SECRET: '',
  CHALLONGE_API_KEY: '',
}))

vi.mock('../../src/main/integrations/challonge', () => ({
  pushToChallonge: vi.fn().mockResolvedValue(undefined),
  startTournament: vi.fn().mockResolvedValue(undefined),
  startTournamentV1: vi.fn().mockResolvedValue(undefined),
  fetchMatches: vi.fn().mockResolvedValue({ matches: [], participants: [] }),
  fetchMatchesV1: vi.fn().mockResolvedValue({ matches: [], participants: [] }),
  updateMatch: vi.fn().mockResolvedValue(undefined),
  updateMatchV1: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/main/integrations/google', () => ({
  updateGoogleForm: vi.fn().mockResolvedValue(undefined),
  fetchSignups: vi.fn().mockResolvedValue([])
}))

vi.mock('../../src/main/appearance', () => ({
  backgroundDataUrl: vi.fn(() => null),
  chooseBackground: vi.fn().mockResolvedValue('background.png'),
  removeBackground: vi.fn(),
}))

const { registerIpcHandlers } = await import('../../src/main/ipc')
registerIpcHandlers()

beforeEach(() => vi.clearAllMocks())

describe('get-tourney', () => {
  it('returns tourney from store', async () => {
    const result = await handlers['get-tourney'](null)
    expect((result as { name: string }).name).toBe('Mock Cup')
  })
})

describe('save-tourney', () => {
  it('calls saveTourney with payload', async () => {
    const { saveTourney } = await import('../../src/main/store')
    const payload = { name: 'New', game: 'Chess', dateTime: '', signupDeadline: '', draftStyle: 'random', eliminationType: 'single', maps: [], rules: '', minPlayers: 2, maxPlayers: 32, teamNames: [], teamSize: 4, streamLink: '', enabledFields: {} }
    await handlers['save-tourney'](null, payload)
    expect(saveTourney).toHaveBeenCalledWith(payload)
  })
})

describe('get-credential', () => {
  it('returns credential for service', async () => {
    const result = await handlers['get-credential'](null, 'google')
    expect(result).toBe('mock-cred')
  })
})

describe('clear-tournament', () => {
  it('calls clearTournamentData', async () => {
    const { clearTournamentData } = await import('../../src/main/store')
    await handlers['clear-tournament'](null)
    expect(clearTournamentData).toHaveBeenCalled()
  })
})

describe('get-appearance', () => {
  it('returns theme and background data url', async () => {
    const result = await handlers['get-appearance'](null)
    expect(result).toEqual({ theme: 'green', backgroundDataUrl: null })
  })
})

describe('set-theme', () => {
  it('persists theme into config', async () => {
    const { saveConfig } = await import('../../src/main/store')
    await handlers['set-theme'](null, 'crimson')
    expect(saveConfig).toHaveBeenCalledWith(expect.objectContaining({ theme: 'crimson' }))
  })

  it('rejects unknown theme ids', async () => {
    await expect(async () => handlers['set-theme'](null, 'neon-zebra')).rejects.toThrow()
  })
})

describe('choose-background / remove-background', () => {
  it('saves chosen file name into config', async () => {
    const { saveConfig } = await import('../../src/main/store')
    await handlers['choose-background'](null)
    expect(saveConfig).toHaveBeenCalledWith(expect.objectContaining({ backgroundImage: 'background.png' }))
  })

  it('clears backgroundImage on remove', async () => {
    const { saveConfig } = await import('../../src/main/store')
    const { removeBackground } = await import('../../src/main/appearance')
    await handlers['remove-background'](null)
    expect(removeBackground).toHaveBeenCalled()
    expect(saveConfig).toHaveBeenCalledWith(expect.objectContaining({ backgroundImage: null }))
  })
})

describe('save-credential', () => {
  it('calls saveCredential with service and value', async () => {
    const { saveCredential } = await import('../../src/main/keychain')
    await handlers['save-credential'](null, 'challonge', 'api-key')
    expect(saveCredential).toHaveBeenCalledWith('challonge', 'api-key')
  })
})

describe('get-matches / update-match credential expiry', () => {
  const pushedSync = { challongeLastPushed: null, challongeTournamentId: 't-1', googleFormId: null, googleFormLastUpdated: null, tournamentStartedAt: null }

  it('translates the expired sentinel from get-matches into a re-auth message', async () => {
    const { readSync } = await import('../../src/main/store')
    const { fetchMatches } = await import('../../src/main/integrations/challonge')
    vi.mocked(readSync).mockReturnValueOnce(pushedSync)
    vi.mocked(fetchMatches).mockRejectedValueOnce(new Error('CHALLONGE_CREDENTIAL_EXPIRED'))
    await expect(handlers['get-matches'](null)).rejects.toThrow('re-authenticate in Settings')
  })

  it('translates the expired sentinel from update-match into a re-auth message', async () => {
    const { readSync } = await import('../../src/main/store')
    const { updateMatch } = await import('../../src/main/integrations/challonge')
    vi.mocked(readSync).mockReturnValueOnce(pushedSync)
    vi.mocked(updateMatch).mockRejectedValueOnce(new Error('CHALLONGE_CREDENTIAL_EXPIRED'))
    await expect(handlers['update-match'](null, 'm-1', '2-1', 'w-1')).rejects.toThrow('re-authenticate in Settings')
  })
})
