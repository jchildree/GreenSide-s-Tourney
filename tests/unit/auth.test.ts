import { describe, it, expect } from 'vitest'
import { generatePKCE } from '../../src/main/auth/google-oauth'

describe('generatePKCE', () => {
  it('returns a verifier of 128 characters', () => {
    const { verifier } = generatePKCE()
    expect(verifier.length).toBe(128)
  })

  it('verifier uses only base64url-safe characters', () => {
    const { verifier } = generatePKCE()
    expect(/^[A-Za-z0-9_-]+$/.test(verifier)).toBe(true)
  })

  it('challenge uses only base64url-safe characters', () => {
    const { challenge } = generatePKCE()
    expect(/^[A-Za-z0-9_-]+$/.test(challenge)).toBe(true)
  })

  it('produces different verifiers on each call', () => {
    const a = generatePKCE()
    const b = generatePKCE()
    expect(a.verifier).not.toBe(b.verifier)
    expect(a.challenge).not.toBe(b.challenge)
  })

  it('challenge is sha256 of verifier, base64url-encoded', () => {
    const { createHash } = require('node:crypto') as typeof import('node:crypto')
    const { verifier, challenge } = generatePKCE()
    const expected = createHash('sha256').update(verifier).digest('base64url')
    expect(challenge).toBe(expected)
  })
})
