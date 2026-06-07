import { ipcMain, shell } from 'electron'
import { readTourney, saveTourney, readSignups, saveSignups, readDraft, saveDraft, readSync, saveSync, readDraftSession, saveDraftSession, buildDraftFromPicks } from './store'
import { getCredential, saveCredential, deleteCredential } from './keychain'
import { pushToChallonge, startTournament } from './integrations/challonge'
import { updateGoogleForm, fetchSignups } from './integrations/google'
import { beginGoogleOAuth } from './auth/google-oauth'
import { beginChallongeOAuth } from './auth/challonge-oauth'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CHALLONGE_CLIENT_ID, CHALLONGE_CLIENT_SECRET } from './auth/oauth-config'
import type { Tourney, DraftPick, OnboardingStatus, DraftSession } from '../shared/types'
import { CRED, CHALLONGE_CREDENTIAL_EXPIRED, GOOGLE_CREDENTIAL_EXPIRED } from '../shared/types'
import { withCredentialGuard } from './credential-guard'

export function registerIpcHandlers(): void {
  ipcMain.handle('get-tourney', () => readTourney())
  ipcMain.handle('save-tourney', (_e, config: Tourney) => saveTourney(config))

  ipcMain.handle('get-signups', () => readSignups())

  ipcMain.handle('get-draft', () => readDraft())
  ipcMain.handle('save-draft', (_e, picks: DraftPick[]) => saveDraft(buildDraftFromPicks(picks)))

  ipcMain.handle('get-sync', () => readSync())

  ipcMain.handle('get-credential', (_e, service: 'google' | 'challonge') =>
    getCredential(service)
  )
  ipcMain.handle('save-credential', (_e, service: 'google' | 'challonge', value: string) =>
    saveCredential(service, value)
  )

  ipcMain.handle('push-to-challonge', async () => {
    const refreshToken = getCredential(CRED.challongeRefresh)
    if (!refreshToken) throw new Error('Challonge not connected -- re-authenticate in Settings')
    const sync = readSync()
    const draft = readDraft()
    const tourney = readTourney()
    const result = await withCredentialGuard(CRED.challongeRefresh, CHALLONGE_CREDENTIAL_EXPIRED, () =>
      pushToChallonge({ refreshToken, tournamentId: sync.challongeTournamentId, draft, tourney })
    )
    try {
      saveSync({ ...sync, challongeTournamentId: result.tournamentId, challongeLastPushed: new Date().toISOString() })
    } catch {
      // Push succeeded; sync state loss is recoverable on next push
    }
  })

  ipcMain.handle('start-tournament', async () => {
    const refreshToken = getCredential(CRED.challongeRefresh)
    if (!refreshToken) throw new Error('Challonge not connected -- re-authenticate in Settings')
    const sync = readSync()
    if (!sync.challongeTournamentId) throw new Error('No tournament pushed yet -- push to Challonge first')
    await withCredentialGuard(CRED.challongeRefresh, CHALLONGE_CREDENTIAL_EXPIRED, () =>
      startTournament({ refreshToken, tournamentId: sync.challongeTournamentId! })
    )
    try {
      saveSync({ ...sync, tournamentStartedAt: new Date().toISOString() })
    } catch {
      // Tournament started on Challonge; sync state loss is recoverable on next push
    }
  })

  ipcMain.handle('update-google-form', async () => {
    const refreshToken = getCredential(CRED.google)
    if (!refreshToken) throw new Error(GOOGLE_CREDENTIAL_EXPIRED)
    const sync = readSync()
    if (!sync.googleFormId) throw new Error('Google Form ID not set -- paste it in the Control tab first')
    const tourney = readTourney()
    await withCredentialGuard(CRED.google, GOOGLE_CREDENTIAL_EXPIRED, () =>
      updateGoogleForm({ refreshToken, formId: sync.googleFormId!, tourney })
    )
    saveSync({ ...sync, googleFormLastUpdated: new Date().toISOString() })
  })

  ipcMain.handle('set-google-form-id', (_e, formId: string) => {
    const sync = readSync()
    saveSync({ ...sync, googleFormId: formId.trim() || null })
  })

  ipcMain.handle('fetch-signups', async () => {
    const refreshToken = getCredential(CRED.google)
    if (!refreshToken) throw new Error(GOOGLE_CREDENTIAL_EXPIRED)
    const sync = readSync()
    if (!sync.googleFormId) throw new Error('Google Form not configured')
    const signups = await withCredentialGuard(CRED.google, GOOGLE_CREDENTIAL_EXPIRED, () =>
      fetchSignups({ refreshToken, formId: sync.googleFormId! })
    )
    saveSignups(signups)
    return signups
  })

  ipcMain.handle('check-onboarding', (): OnboardingStatus => {
    const googleConnected = getCredential(CRED.google) !== null
    const challongeConnected = getCredential(CRED.challongeRefresh) !== null
    return {
      googleConnected,
      challongeConnected,
      complete: googleConnected && challongeConnected,
    }
  })

  ipcMain.handle('begin-google-oauth', async (): Promise<void> => {
    const { refreshToken } = await beginGoogleOAuth(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
    saveCredential(CRED.google, refreshToken)
  })

  ipcMain.handle('begin-challonge-oauth', async (): Promise<void> => {
    if (!CHALLONGE_CLIENT_ID || !CHALLONGE_CLIENT_SECRET) {
      throw new Error('Challonge OAuth credentials not configured. Fill in oauth-config.ts.')
    }
    const { accessToken, refreshToken } = await beginChallongeOAuth(CHALLONGE_CLIENT_ID, CHALLONGE_CLIENT_SECRET)
    saveCredential(CRED.challonge, accessToken)
    saveCredential(CRED.challongeRefresh, refreshToken)
  })

  ipcMain.handle('get-draft-session', () => readDraftSession())
  ipcMain.handle('save-draft-session', (_e, s: DraftSession) => saveDraftSession(s))

  ipcMain.handle('open-external', (_e, url: string) => shell.openExternal(url))
}
