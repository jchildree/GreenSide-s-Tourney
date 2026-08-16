import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { pushToChallonge, startTournament, fetchMatches, updateMatch, buildTournamentAttrs } from '../../../src/main/integrations/challonge'

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
    eliminationType: 'single' as const,
    maps: [],
    rules: '',
    minPlayers: 2,
    maxPlayers: 32,
    teamNames: [],
    teamSize: 4,
    streamLink: '',
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
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }), text: async () => '' }) // GET participants (empty, no DELETEs, no bulk_add)
    const result = await pushToChallonge({ ...baseParams, tournamentId: 'existing-456' })
    expect(result).toEqual({ tournamentId: 'existing-456' })
    expect(mockFetch).toHaveBeenCalledTimes(2)
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

  it('includes rollback status in error when DELETE also fails after bulk_add failure', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-123' } }),
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => 'too many participants',
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'server error',
        json: async () => ({}),
      })

    await expect(
      pushToChallonge({
        ...baseParams,
        tournamentId: null,
        draft: { teams: [{ name: 'T', players: [] }], pickOrder: [] },
      })
    ).rejects.toThrow('rollback DELETE also failed (500)')
  })

  it('throws original participants error when rollback DELETE succeeds', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-123' } }),
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => 'too many participants',
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '',
        json: async () => ({}),
      })

    await expect(
      pushToChallonge({
        ...baseParams,
        tournamentId: null,
        draft: { teams: [{ name: 'T', players: [] }], pickOrder: [] },
      })
    ).rejects.toThrow('Failed to add participants to Challonge (422)')
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

  it('clears all participants when re-pushing with empty teams', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) })  // PATCH
      .mockResolvedValueOnce({                                                              // GET participants
        ok: true,
        json: async () => ({ data: [{ id: 'old1' }, { id: 'old2' }] }),
        text: async () => '',
      })
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) })  // DELETE old1
      .mockResolvedValueOnce({ ok: true, text: async () => '', json: async () => ({}) })  // DELETE old2

    const result = await pushToChallonge({
      ...baseParams,
      tournamentId: 'existing-456',
      draft: { teams: [], pickOrder: [] },
    })
    expect(result).toEqual({ tournamentId: 'existing-456' })
    expect(mockFetch).toHaveBeenCalledTimes(4) // PATCH + GET + 2 DELETEs, no bulk_add
  })
})

describe('pushToChallonge stream_link', () => {
  beforeEach(() => mockFetch.mockReset())
  afterEach(() => vi.clearAllMocks())

  it('includes stream_link in attrs when streamLink is set', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'new-123' } }),
      text: async () => '',
    })
    await pushToChallonge({
      ...baseParams,
      tournamentId: null,
      tourney: { ...baseParams.tourney, streamLink: 'https://twitch.tv/example' },
    })
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(body.data.attributes.stream_link).toBe('https://twitch.tv/example')
  })

  it('omits stream_link from attrs when streamLink is empty', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'new-123' } }),
      text: async () => '',
    })
    await pushToChallonge({
      ...baseParams,
      tournamentId: null,
      tourney: { ...baseParams.tourney, streamLink: '' },
    })
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(body.data.attributes.stream_link).toBeUndefined()
  })
})

describe('startTournament', () => {
  const startParams = {
    refreshToken: 'fake-refresh',
    tournamentId: 'tourney-123',
  }

  beforeEach(() => mockFetch.mockReset())
  afterEach(() => vi.clearAllMocks())

  it('POSTs to the start endpoint and resolves on 200', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })
    await expect(startTournament(startParams)).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/tournaments/tourney-123/start.json'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer mock-access-token' }),
      })
    )
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 422, text: async () => 'Tournament already started' })
    await expect(startTournament(startParams)).rejects.toThrow('Failed to start tournament (422)')
  })
})

describe('fetchMatches', () => {
  beforeEach(() => mockFetch.mockReset())
  afterEach(() => vi.clearAllMocks())

  it('fetches and maps matches and participants', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{
            id: 'match-1',
            attributes: {
              state: 'open',
              round: 1,
              scores_csv: null,
              winner_id: null,
              player1_id: 'p1',
              player2_id: 'p2',
              suggested_play_order: 1,
            },
          }],
        }),
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: 'p1', attributes: { name: 'Team Alpha' } },
            { id: 'p2', attributes: { name: 'Team Beta' } },
          ],
        }),
        text: async () => '',
      })
    const result = await fetchMatches({ refreshToken: 'fake', tournamentId: 'tid' })
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0]).toEqual({
      id: 'match-1',
      state: 'open',
      round: 1,
      player1Id: 'p1',
      player2Id: 'p2',
      winnerId: null,
      scoresCsv: null,
      suggestedPlayOrder: 1,
    })
    expect(result.participants).toEqual([
      { id: 'p1', name: 'Team Alpha' },
      { id: 'p2', name: 'Team Beta' },
    ])
  })

  it('throws when matches request fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 422, text: async () => 'bad request', json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }), text: async () => '' })
    await expect(fetchMatches({ refreshToken: 'fake', tournamentId: 'tid' }))
      .rejects.toThrow('Failed to fetch matches (422)')
  })

  it('throws when participants request fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }), text: async () => '' })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'server error', json: async () => ({}) })
    await expect(fetchMatches({ refreshToken: 'fake', tournamentId: 'tid' }))
      .rejects.toThrow('Failed to fetch participants (500)')
  })
})

describe('updateMatch', () => {
  beforeEach(() => mockFetch.mockReset())
  afterEach(() => vi.clearAllMocks())

  it('PUTs scores_csv and winner_id to the match endpoint', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })
    await expect(
      updateMatch({ refreshToken: 'fake', tournamentId: 'tid', matchId: 'mid', scoresCsv: '3-1', winnerId: 'p1' })
    ).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/matches/mid.json'),
      expect.objectContaining({ method: 'PUT' })
    )
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(body.data.attributes.scores_csv).toBe('3-1')
    expect(body.data.attributes.winner_id).toBe('p1')
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 422, text: async () => 'invalid scores' })
    await expect(
      updateMatch({ refreshToken: 'fake', tournamentId: 'tid', matchId: 'mid', scoresCsv: '3-1', winnerId: 'p1' })
    ).rejects.toThrow('Failed to update match (422)')
  })
})

describe('buildTournamentAttrs', () => {
  it('uses single elimination by default', () => {
    const attrs = buildTournamentAttrs({ ...baseParams.tourney, eliminationType: 'single' })
    expect(attrs.tournament_type).toBe('single elimination')
  })

  it('uses double elimination when eliminationType is double', () => {
    const attrs = buildTournamentAttrs({ ...baseParams.tourney, eliminationType: 'double' })
    expect(attrs.tournament_type).toBe('double elimination')
  })

  it('includes per-round maps and rules in the description', () => {
    const attrs = buildTournamentAttrs({
      ...baseParams.tourney,
      maps: [['Dust II'], ['Inferno']],
      rules: 'Best of 3.',
    })
    expect(attrs.description).toContain('Round 1: Dust II')
    expect(attrs.description).toContain('Round 2: Inferno')
    expect(attrs.description).toContain('Best of 3.')
  })

  it('omits description when no maps or rules', () => {
    const attrs = buildTournamentAttrs({ ...baseParams.tourney, maps: [], rules: '' })
    expect(attrs.description).toBeUndefined()
  })

  it('builds description with no Rules header when only maps are present', () => {
    const attrs = buildTournamentAttrs({ ...baseParams.tourney, maps: [['Dust II', 'Inferno']], rules: '' })
    expect(attrs.description).toContain('Round 1: Dust II, Inferno')
    expect(attrs.description).not.toContain('Rules:')
  })

  it('builds description with no Maps header when only rules are present', () => {
    const attrs = buildTournamentAttrs({ ...baseParams.tourney, maps: [], rules: 'Best of 3.' })
    expect(attrs.description).toContain('Rules:\nBest of 3.')
    expect(attrs.description).not.toContain('Maps:')
  })

  it('omits description when maps are empty and rules are whitespace only', () => {
    const attrs = buildTournamentAttrs({ ...baseParams.tourney, maps: [], rules: '   ' })
    expect(attrs.description).toBeUndefined()
  })
})
