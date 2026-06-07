import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/main/keychain', () => ({
  deleteCredential: vi.fn(),
}))

import { withCredentialGuard } from '../../src/main/credential-guard'
import { deleteCredential } from '../../src/main/keychain'

describe('withCredentialGuard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns fn result when fn succeeds', async () => {
    const result = await withCredentialGuard('google', 'MY_SENTINEL', async () => 'ok')
    expect(result).toBe('ok')
    expect(deleteCredential).not.toHaveBeenCalled()
  })

  it('deletes credential and rethrows when sentinel matches', async () => {
    const err = new Error('MY_SENTINEL')
    await expect(
      withCredentialGuard('google', 'MY_SENTINEL', async () => { throw err })
    ).rejects.toThrow('MY_SENTINEL')
    expect(deleteCredential).toHaveBeenCalledOnce()
    expect(deleteCredential).toHaveBeenCalledWith('google')
  })

  it('rethrows without deleting when error message does not match sentinel', async () => {
    const err = new Error('some other error')
    await expect(
      withCredentialGuard('google', 'MY_SENTINEL', async () => { throw err })
    ).rejects.toThrow('some other error')
    expect(deleteCredential).not.toHaveBeenCalled()
  })
})
