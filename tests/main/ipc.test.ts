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
  readTourney: vi.fn(() => ({ name: 'Mock Cup', game: '', dateTime: '', signupDeadline: '', draftStyle: 'random', minPlayers: 2, maxPlayers: 32 })),
  saveTourney: vi.fn(),
  readSignups: vi.fn(() => []),
  saveSignups: vi.fn(),
  readDraft: vi.fn(() => ({ teams: [], pickOrder: [] })),
  saveDraft: vi.fn(),
  readSync: vi.fn(() => ({ challongeLastPushed: null, challongeTournamentId: null, googleFormLastUpdated: null })),
  saveSync: vi.fn()
}))

vi.mock('../../src/main/keychain', () => ({
  getCredential: vi.fn(() => 'mock-cred'),
  saveCredential: vi.fn()
}))

vi.mock('../../src/main/integrations/challonge', () => ({
  pushToChallonge: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../../src/main/integrations/google', () => ({
  updateGoogleForm: vi.fn().mockResolvedValue(undefined),
  fetchSignups: vi.fn().mockResolvedValue([])
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
    const payload = { name: 'New', game: 'Chess', dateTime: '', signupDeadline: '', draftStyle: 'random', minPlayers: 2, maxPlayers: 32 }
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

describe('save-credential', () => {
  it('calls saveCredential with service and value', async () => {
    const { saveCredential } = await import('../../src/main/keychain')
    await handlers['save-credential'](null, 'challonge', 'api-key')
    expect(saveCredential).toHaveBeenCalledWith('challonge', 'api-key')
  })
})
