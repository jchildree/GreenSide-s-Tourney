import { describe, it, expect } from 'vitest'
import { pushToChallonge } from '../../../src/main/integrations/challonge'

describe('pushToChallonge', () => {
  it('returns a promise', () => {
    const result = pushToChallonge({ apiKey: 'key', tournamentId: null, draft: { teams: [], pickOrder: [] } })
    result.catch(() => {})
    expect(result).toBeInstanceOf(Promise)
  })

  it('rejects with not-implemented error', async () => {
    await expect(
      pushToChallonge({ apiKey: 'key', tournamentId: null, draft: { teams: [], pickOrder: [] } })
    ).rejects.toThrow('not implemented')
  })
})
