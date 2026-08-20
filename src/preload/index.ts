import { contextBridge, ipcRenderer } from 'electron'
import type { Tourney, Signups, Draft, DraftPick, Sync, CredentialService, DraftSession, ChallongeMatch, ChallongeParticipant, Appearance, ThemeId, Player, Balances, Pot } from '../shared/types'

const api = {
  getTourney: (): Promise<Tourney> => ipcRenderer.invoke('get-tourney'),
  saveTourney: (config: Tourney): Promise<void> => ipcRenderer.invoke('save-tourney', config),

  getSignups: (): Promise<Signups> => ipcRenderer.invoke('get-signups'),
  saveSignups: (signups: Player[]): Promise<void> => ipcRenderer.invoke('save-signups', signups),
  fetchSignups: (): Promise<Signups> => ipcRenderer.invoke('fetch-signups'),

  getBalances: (): Promise<Balances> => ipcRenderer.invoke('get-balances'),
  saveBalances: (balances: Balances): Promise<void> => ipcRenderer.invoke('save-balances', balances),

  getPot: (): Promise<Pot> => ipcRenderer.invoke('get-pot'),
  savePot: (pot: Pot): Promise<void> => ipcRenderer.invoke('save-pot', pot),

  getDraft: (): Promise<Draft> => ipcRenderer.invoke('get-draft'),
  saveDraft: (picks: DraftPick[]): Promise<void> => ipcRenderer.invoke('save-draft', picks),

  getSync: (): Promise<Sync> => ipcRenderer.invoke('get-sync'),

  updateGoogleForm: (): Promise<void> => ipcRenderer.invoke('update-google-form'),
  pushToChallonge: (): Promise<void> => ipcRenderer.invoke('push-to-challonge'),
  startTournament: (): Promise<void> => ipcRenderer.invoke('start-tournament'),

  getCredential: (service: CredentialService): Promise<string | null> =>
    ipcRenderer.invoke('get-credential', service),
  saveCredential: (service: CredentialService, value: string): Promise<void> =>
    ipcRenderer.invoke('save-credential', service, value),

  checkOnboarding: (): Promise<import('../shared/types').OnboardingStatus> =>
    ipcRenderer.invoke('check-onboarding'),

  beginGoogleOAuth: (): Promise<void> =>
    ipcRenderer.invoke('begin-google-oauth'),

  beginChallongeOAuth: (): Promise<void> =>
    ipcRenderer.invoke('begin-challonge-oauth'),

  setGoogleFormId: (formId: string): Promise<void> =>
    ipcRenderer.invoke('set-google-form-id', formId),

  clearTournament: (): Promise<void> => ipcRenderer.invoke('clear-tournament'),

  getDraftSession: (): Promise<DraftSession> => ipcRenderer.invoke('get-draft-session'),
  saveDraftSession: (s: DraftSession): Promise<void> => ipcRenderer.invoke('save-draft-session', s),

  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('open-external', url),

  disconnectGoogle: (): Promise<void> => ipcRenderer.invoke('disconnect-google'),
  disconnectChallonge: (): Promise<void> => ipcRenderer.invoke('disconnect-challonge'),
  getMatches: (): Promise<{ matches: ChallongeMatch[]; participants: ChallongeParticipant[] }> =>
    ipcRenderer.invoke('get-matches'),
  updateMatch: (matchId: string, scoresCsv: string, winnerId: string): Promise<void> =>
    ipcRenderer.invoke('update-match', matchId, scoresCsv, winnerId),

  getAppearance: (): Promise<Appearance> => ipcRenderer.invoke('get-appearance'),
  setTheme: (theme: ThemeId): Promise<void> => ipcRenderer.invoke('set-theme', theme),
  chooseBackground: (): Promise<string | null> => ipcRenderer.invoke('choose-background'),
  removeBackground: (): Promise<void> => ipcRenderer.invoke('remove-background'),
  setBackgroundOpacity: (value: number): Promise<void> =>
    ipcRenderer.invoke('set-background-opacity', value),
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
