/// <reference types="vite/client" />
import type { Tourney, Signups, Draft, DraftPick, Sync, CredentialService } from '../shared/types'

declare global {
  interface Window {
    api: {
      getTourney: () => Promise<Tourney>
      saveTourney: (config: Tourney) => Promise<void>
      getSignups: () => Promise<Signups>
      fetchSignups: () => Promise<Signups>
      getDraft: () => Promise<Draft>
      saveDraft: (picks: DraftPick[]) => Promise<void>
      getSync: () => Promise<Sync>
      updateGoogleForm: () => Promise<void>
      pushToChallonge: () => Promise<void>
      getCredential: (service: CredentialService) => Promise<string | null>
      saveCredential: (service: CredentialService, value: string) => Promise<void>
      checkOnboarding: () => Promise<import('../shared/types').OnboardingStatus>
      beginGoogleOAuth: () => Promise<void>
      verifyChallongeKey: (apiKey: string, communityUrl: string) => Promise<boolean>
    }
  }
}
