import { contextBridge, ipcRenderer } from 'electron'
import type { Tourney, Signups, Draft, DraftPick, Sync, CredentialService } from '../shared/types'

const api = {
  getTourney: (): Promise<Tourney> => ipcRenderer.invoke('get-tourney'),
  saveTourney: (config: Tourney): Promise<void> => ipcRenderer.invoke('save-tourney', config),

  getSignups: (): Promise<Signups> => ipcRenderer.invoke('get-signups'),
  fetchSignups: (): Promise<Signups> => ipcRenderer.invoke('fetch-signups'),

  getDraft: (): Promise<Draft> => ipcRenderer.invoke('get-draft'),
  saveDraft: (picks: DraftPick[]): Promise<void> => ipcRenderer.invoke('save-draft', picks),

  getSync: (): Promise<Sync> => ipcRenderer.invoke('get-sync'),

  updateGoogleForm: (): Promise<void> => ipcRenderer.invoke('update-google-form'),
  pushToChallonge: (): Promise<void> => ipcRenderer.invoke('push-to-challonge'),

  getCredential: (service: CredentialService): Promise<string | null> =>
    ipcRenderer.invoke('get-credential', service),
  saveCredential: (service: CredentialService, value: string): Promise<void> =>
    ipcRenderer.invoke('save-credential', service, value),

  checkOnboarding: (): Promise<import('../shared/types').OnboardingStatus> =>
    ipcRenderer.invoke('check-onboarding'),

  beginGoogleOAuth: (): Promise<void> =>
    ipcRenderer.invoke('begin-google-oauth'),

  verifyChallongeKey: (apiKey: string, communityUrl: string): Promise<boolean> =>
    ipcRenderer.invoke('verify-challonge-key', apiKey, communityUrl),
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
