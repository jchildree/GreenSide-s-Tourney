import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'

const mockEncrypt = vi.fn((s: string) => Buffer.from(`enc:${s}`))
const mockDecrypt = vi.fn((b: Buffer) => b.toString().replace('enc:', ''))

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/fake/userData') },
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: mockEncrypt,
    decryptString: mockDecrypt
  }
}))
vi.mock('fs')

const { getCredential, saveCredential } = await import('../../src/main/keychain')

beforeEach(() => vi.clearAllMocks())

describe('saveCredential', () => {
  it('encrypts value and writes to file', () => {
    const write = vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined)
    saveCredential('google', 'my-token')
    expect(mockEncrypt).toHaveBeenCalledWith('my-token')
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('google.enc'),
      expect.any(Buffer)
    )
  })
})

describe('getCredential', () => {
  it('returns null when file missing', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    expect(getCredential('challonge')).toBeNull()
  })

  it('decrypts and returns value', () => {
    const buf = Buffer.from('enc:api-key-123')
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(buf)
    expect(getCredential('challonge')).toBe('api-key-123')
  })
})
