import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { refreshAccessToken } from '../../../src/main/integrations/token-refresh'

const saveCredential = vi.fn()
vi.mock('../../../src/main/keychain', () => ({
  saveCredential: (...args: unknown[]) => saveCredential(...args),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const base = {
  tokenUrl: 'https://api.challonge.com/oauth/token',
  clientId: 'cid',
  clientSecret: 'secret',
  refreshToken: 'old-refresh',
  serviceName: 'Challonge',
}

describe('refreshAccessToken rotation', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    saveCredential.mockReset()
  })
  afterEach(() => vi.clearAllMocks())

  it('persists a rotated refresh token so the next call does not hit invalid_grant', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }),
      text: async () => '',
    })
    const token = await refreshAccessToken({ ...base, credService: 'challonge-refresh' })
    expect(token).toBe('new-access')
    expect(saveCredential).toHaveBeenCalledWith('challonge-refresh', 'new-refresh')
  })

  it('does not persist when the provider returns no new refresh token (e.g. Google)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-access' }),
      text: async () => '',
    })
    await refreshAccessToken({ ...base, credService: 'challonge-refresh' })
    expect(saveCredential).not.toHaveBeenCalled()
  })

  it('does not persist when no credService is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }),
      text: async () => '',
    })
    await refreshAccessToken(base)
    expect(saveCredential).not.toHaveBeenCalled()
  })

  it('throws CHALLONGE_CREDENTIAL_EXPIRED on invalid_grant', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 'invalid_grant' }),
    })
    await expect(refreshAccessToken({ ...base, credService: 'challonge-refresh' }))
      .rejects.toThrow('CHALLONGE_CREDENTIAL_EXPIRED')
  })
})
