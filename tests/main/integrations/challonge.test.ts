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
    teamNames: [],
    teamSize: 4,
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
    mockFetch
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) })       // PATCH
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }), text: async () => '' }) // GET participants (empty)
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
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 403, text: async () => 'Forbidden' }) // PATCH fails
    await expect(
      pushToChallonge({ ...baseParams, tournamentId: 'existing-456' })
    ).rejects.toThrow('Failed to update Challonge tournament (403)')
  })
})

describe('participant sync on re-push', () => {
  beforeEach(() => mockFetch.mockReset())
  afterEach(() => vi.clearAllMocks())

  it('clears old participants and re-adds current teams', async () => {
    const draftWithTeams = {
      teams: [
        { name: 'Team Alpha', players: ['Alice', 'Bob'] },
        { name: 'Team Beta', players: ['Carol'] },
      ],
      pickOrder: ['Alice', 'Carol', 'Bob'],
    }
    mockFetch
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) })  // PATCH
      .mockResolvedValueOnce({                                                              // GET participants
        ok: true,
        json: async () => ({ data: [{ id: 'p1' }, { id: 'p2' }] }),
        text: async () => '',
      })
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) })  // DELETE p1
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) })  // DELETE p2
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) })  // bulk_add

    const result = await pushToChallonge({
      ...baseParams,
      tournamentId: 'existing-456',
      draft: draftWithTeams,
    })
    expect(result).toEqual({ tournamentId: 'existing-456' })
    expect(mockFetch).toHaveBeenCalledTimes(5)
  })

  it('skips delete loop and goes straight to bulk_add when no existing participants', async () => {
    const draftWithTeams = {
      teams: [{ name: 'Team A', players: [] }],
      pickOrder: [],
    }
    mockFetch
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) })       // PATCH
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }), text: async () => '' }) // GET (empty)
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) })       // bulk_add

    await pushToChallonge({
      ...baseParams,
      tournamentId: 'existing-456',
      draft: draftWithTeams,
    })
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('throws when participant fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) }) // PATCH
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Server error', json: async () => ({}) })

    await expect(
      pushToChallonge({
        ...baseParams,
        tournamentId: 'existing-456',
        draft: { teams: [{ name: 'T', players: [] }], pickOrder: [] },
      })
    ).rejects.toThrow('Failed to fetch participants (500)')
  })

  it('throws when participant delete fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) })  // PATCH
      .mockResolvedValueOnce({                                                              // GET
        ok: true,
        json: async () => ({ data: [{ id: 'p99' }] }),
        text: async () => '',
      })
      .mockResolvedValueOnce({ ok: false, status: 403, text: async () => 'Forbidden', json: async () => ({}) }) // DELETE

    await expect(
      pushToChallonge({
        ...baseParams,
        tournamentId: 'existing-456',
        draft: { teams: [{ name: 'T', players: [] }], pickOrder: [] },
      })
    ).rejects.toThrow('Failed to remove participant p99 (403)')
  })
})
