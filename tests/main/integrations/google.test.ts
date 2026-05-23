import { describe, it, expect } from 'vitest'
import { updateGoogleForm, fetchSignups } from '../../../src/main/integrations/google'
import type { Tourney } from '../../../src/shared/types'

const fakeTourney: Tourney = {
  name: 'Test', game: 'Chess', dateTime: '', signupDeadline: '',
  draftStyle: 'random', minPlayers: 2, maxPlayers: 32
}

describe('updateGoogleForm', () => {
  it('rejects with not-implemented', async () => {
    await expect(updateGoogleForm({ oauthToken: 'tok', tourney: fakeTourney })).rejects.toThrow('not implemented')
  })
})

describe('fetchSignups', () => {
  it('rejects with not-implemented', async () => {
    await expect(fetchSignups({ oauthToken: 'tok', formId: 'abc' })).rejects.toThrow('not implemented')
  })
})
