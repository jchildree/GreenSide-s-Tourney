/// <reference types="vite/client" />
import type { Tourney, Signups, Draft, DraftPick, Sync, CredentialService, DraftSession, ChallongeMatch, ChallongeParticipant } from '../shared/types'

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
      startTournament: () => Promise<void>
      getCredential: (service: CredentialService) => Promise<string | null>
      saveCredential: (service: CredentialService, value: string) => Promise<void>
      checkOnboarding: () => Promise<import('../shared/types').OnboardingStatus>
      beginGoogleOAuth: () => Promise<void>
      beginChallongeOAuth: () => Promise<void>
      setGoogleFormId: (formId: string) => Promise<void>
      clearTournament: () => Promise<void>
      getDraftSession: () => Promise<DraftSession>
      saveDraftSession: (s: DraftSession) => Promise<void>
      openExternal: (url: string) => Promise<void>
      disconnectGoogle: () => Promise<void>
      disconnectChallonge: () => Promise<void>
      getMatches: () => Promise<{ matches: ChallongeMatch[]; participants: ChallongeParticipant[] }>
      updateMatch: (matchId: string, scoresCsv: string, winnerId: string) => Promise<void>
    }
  }
}
