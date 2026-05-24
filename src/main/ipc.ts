import { ipcMain } from 'electron'
import { readTourney, saveTourney, readSignups, readDraft, saveDraft, readSync } from './store'
import { getCredential, saveCredential } from './keychain'
import { pushToChallonge } from './integrations/challonge'
import { updateGoogleForm, fetchSignups } from './integrations/google'
import { beginGoogleOAuth } from './auth/google-oauth'
import { beginChallongeOAuth } from './auth/challonge-oauth'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CHALLONGE_CLIENT_ID, CHALLONGE_CLIENT_SECRET } from './auth/oauth-config'
import type { Tourney, DraftPick, Draft, Team, OnboardingStatus } from '../shared/types'

export function registerIpcHandlers(): void {
  ipcMain.handle('get-tourney', () => readTourney())
  ipcMain.handle('save-tourney', (_e, config: Tourney) => saveTourney(config))

  ipcMain.handle('get-signups', () => readSignups())

  ipcMain.handle('get-draft', () => readDraft())
  ipcMain.handle('save-draft', (_e, picks: DraftPick[]) => {
    const teamMap = new Map<string, string[]>()
    for (const pick of picks) {
      if (!teamMap.has(pick.teamName)) teamMap.set(pick.teamName, [])
      teamMap.get(pick.teamName)!.push(pick.playerName)
    }
    const teams: Team[] = Array.from(teamMap.entries()).map(([name, players]) => ({ name, players }))
    const draft: Draft = { teams, pickOrder: picks.map(p => p.playerName) }
    saveDraft(draft)
  })

  ipcMain.handle('get-sync', () => readSync())

  ipcMain.handle('get-credential', (_e, service: 'google' | 'challonge') =>
    getCredential(service)
  )
  ipcMain.handle('save-credential', (_e, service: 'google' | 'challonge', value: string) =>
    saveCredential(service, value)
  )

  ipcMain.handle('push-to-challonge', async () => {
    const accessToken = getCredential('challonge')
    if (!accessToken) throw new Error('Challonge not connected')
    const sync = readSync()
    const draft = readDraft()
    await pushToChallonge({ accessToken, tournamentId: sync.challongeTournamentId, draft })
  })

  ipcMain.handle('update-google-form', async () => {
    const oauthToken = getCredential('google')
    if (!oauthToken) throw new Error('Google OAuth token not set')
    const tourney = readTourney()
    await updateGoogleForm({ oauthToken, tourney })
  })

  ipcMain.handle('fetch-signups', async () => {
    const oauthToken = getCredential('google')
    if (!oauthToken) throw new Error('Google OAuth token not set')
    const sync = readSync()
    if (!sync.googleFormId) throw new Error('Google Form not configured')
    return fetchSignups({ oauthToken, formId: sync.googleFormId })
  })

  ipcMain.handle('check-onboarding', (): OnboardingStatus => {
    const googleConnected = getCredential('google') !== null
    const challongeConnected = getCredential('challonge') !== null
    return {
      googleConnected,
      challongeConnected,
      complete: googleConnected && challongeConnected,
    }
  })

  ipcMain.handle('begin-google-oauth', async (): Promise<void> => {
    const { refreshToken } = await beginGoogleOAuth(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
    saveCredential('google', refreshToken)
  })

  ipcMain.handle('begin-challonge-oauth', async (): Promise<void> => {
    if (!CHALLONGE_CLIENT_ID || !CHALLONGE_CLIENT_SECRET) {
      throw new Error('Challonge OAuth credentials not configured. Fill in oauth-config.ts.')
    }
    const { accessToken, refreshToken } = await beginChallongeOAuth(CHALLONGE_CLIENT_ID, CHALLONGE_CLIENT_SECRET)
    saveCredential('challonge', accessToken)
    saveCredential('challonge-refresh', refreshToken)
  })
}
