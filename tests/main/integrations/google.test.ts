import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { updateGoogleForm, fetchSignups } from '../../../src/main/integrations/google'
import type { Tourney } from '../../../src/shared/types'

vi.mock('../../../src/main/integrations/token-refresh', () => ({
  refreshAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const fakeTourney: Tourney = {
  name: 'Test',
  game: 'Chess',
  dateTime: '',
  signupDeadline: '',
  draftStyle: 'random',
  minPlayers: 2,
  maxPlayers: 32,
}

describe('updateGoogleForm', () => {
  beforeEach(() => mockFetch.mockReset())
  afterEach(() => vi.clearAllMocks())

  it('sends batchUpdate to the form endpoint', async () => {
    mockFetch.mockResolvedValue({ ok: true, text: async () => '' })
    await expect(
      updateGoogleForm({ refreshToken: 'tok', formId: 'form-abc', tourney: fakeTourney })
    ).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('form-abc'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws when Forms API returns error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, text: async () => 'Bad Request' })
    await expect(
      updateGoogleForm({ refreshToken: 'tok', formId: 'form-abc', tourney: fakeTourney })
    ).rejects.toThrow('Google Forms update failed (400)')
  })
})

describe('fetchSignups', () => {
  beforeEach(() => mockFetch.mockReset())
  afterEach(() => vi.clearAllMocks())

  it('returns empty array when form has no responses', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ responses: [] }) })
    const result = await fetchSignups({ refreshToken: 'tok', formId: 'form-abc' })
    expect(result).toEqual([])
  })

  it('throws when form info fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, text: async () => 'Not Found' })
    await expect(
      fetchSignups({ refreshToken: 'tok', formId: 'form-abc' })
    ).rejects.toThrow('Failed to fetch form info (404)')
  })
})
