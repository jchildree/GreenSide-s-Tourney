import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { pushToChallonge } from '../../../src/main/integrations/challonge'

vi.mock('../../../src/main/integrations/token-refresh', () => ({
  refreshAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const baseParams = {
  refreshToken: 'fake-refresh',
  draft: { teams: [], pickOrder: [] },
  tourney: {
    name: 'Test Tourney',
    game: 'Chess',
    dateTime: '',
    signupDeadline: '',
    draftStyle: 'snake' as const,
    minPlayers: 2,
    maxPlayers: 32,
  },
}

describe('pushToChallonge', () => {
  beforeEach(() => mockFetch.mockReset())
  afterEach(() => vi.clearAllMocks())

  it('creates tournament and returns new ID when no existing ID', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'new-123' } }),
      text: async () => '',
    })
    const result = await pushToChallonge({ ...baseParams, tournamentId: null })
    expect(result).toEqual({ tournamentId: 'new-123' })
  })

  it('updates existing tournament and returns same ID', async () => {
    mockFetch.mockResolvedValue({ ok: true, text: async () => '', json: async () => ({}) })
    const result = await pushToChallonge({ ...baseParams, tournamentId: 'existing-456' })
    expect(result).toEqual({ tournamentId: 'existing-456' })
  })

  it('throws when create API returns error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 422, text: async () => 'Unprocessable' })
    await expect(
      pushToChallonge({ ...baseParams, tournamentId: null })
    ).rejects.toThrow('Failed to create Challonge tournament (422)')
  })

  it('throws when update API returns error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403, text: async () => 'Forbidden' })
    await expect(
      pushToChallonge({ ...baseParams, tournamentId: 'existing-456' })
    ).rejects.toThrow('Failed to update Challonge tournament (403)')
  })
})
