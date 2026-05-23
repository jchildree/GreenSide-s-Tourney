import { ipcMain } from 'electron'
import { readTourney, saveTourney, readSignups, readDraft, saveDraft, readSync, readConfig, saveConfig } from './store'
import { getCredential, saveCredential } from './keychain'
import { pushToChallonge } from './integrations/challonge'
import { updateGoogleForm, fetchSignups } from './integrations/google'
import { beginGoogleOAuth } from './auth/google-oauth'
import { verifyChallongeKey } from './auth/challonge-verify'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from './auth/oauth-config'
import type { Tourney, DraftPick, Draft, Team, OnboardingStatus, AppConfig } from '../shared/types'

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
    const apiKey = getCredential('challonge')
    if (!apiKey) throw new Error('Challonge API key not set')
    const sync = readSync()
    const draft = readDraft()
    await pushToChallonge({ apiKey, tournamentId: sync.challongeTournamentId, draft })
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

  ipcMain.handle(
    'verify-challonge-key',
    async (_e, apiKey: string, communityUrl: string): Promise<boolean> => {
      const valid = await verifyChallongeKey(apiKey)
      if (valid) {
        saveCredential('challonge', apiKey)
        const cfg: AppConfig = { challongeCommunityUrl: communityUrl }
        saveConfig(cfg)
      }
      return valid
    }
  )
}
