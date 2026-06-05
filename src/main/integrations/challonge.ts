import { CHALLONGE_CLIENT_ID, CHALLONGE_CLIENT_SECRET } from '../auth/oauth-config'
import type { Draft, Tourney } from '../../shared/types'
import { refreshAccessToken } from './token-refresh'

const API_BASE = 'https://api.challonge.com/v2.1'
const TOKEN_URL = 'https://api.challonge.com/oauth/token'

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Authorization-Type': 'v2',
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/json',
  }
}

interface PushParams {
  refreshToken: string
  tournamentId: string | null
  draft: Draft
  tourney: Tourney
}

export async function pushToChallonge(params: PushParams): Promise<{ tournamentId: string }> {
  const { refreshToken, tournamentId: existingId, draft, tourney } = params
  if (!CHALLONGE_CLIENT_ID || !CHALLONGE_CLIENT_SECRET) {
    throw new Error('Challonge OAuth credentials not configured in oauth-config.ts')
  }
  const accessToken = await refreshAccessToken({
    tokenUrl: TOKEN_URL,
    clientId: CHALLONGE_CLIENT_ID!,
    clientSecret: CHALLONGE_CLIENT_SECRET!,
    refreshToken,
    serviceName: 'Challonge',
  })
  const hdrs = authHeaders(accessToken)

  const attrs: Record<string, unknown> = {
    name: tourney.name || 'Tournament',
    tournament_type: 'single elimination',
  }
  if (tourney.game) attrs.game_name = tourney.game
  if (tourney.dateTime) attrs.starts_at = tourney.dateTime

  let tournamentId: string

  if (existingId) {
    const patchResp = await fetch(`${API_BASE}/tournaments/${existingId}.json`, {
      method: 'PATCH',
      headers: hdrs,
      body: JSON.stringify({ data: { type: 'tournament', attributes: attrs } }),
    })
    if (!patchResp.ok) {
      const body = await patchResp.text()
      throw new Error(`Failed to update Challonge tournament (${patchResp.status}): ${body}`)
    }
    tournamentId = existingId
  } else {
    const createResp = await fetch(`${API_BASE}/tournaments.json`, {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({ data: { type: 'tournament', attributes: attrs } }),
    })
    if (!createResp.ok) {
      const body = await createResp.text()
      throw new Error(`Failed to create Challonge tournament (${createResp.status}): ${body}`)
    }
    const createData = (await createResp.json()) as { data: { id: string } }
    tournamentId = createData.data.id

    if (draft.teams.length > 0) {
      const participants = draft.teams.map(t => ({ name: t.name }))
      const addResp = await fetch(`${API_BASE}/tournaments/${tournamentId}/participants/bulk_add.json`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ data: { type: 'Participants', attributes: { participants } } }),
      })
      if (!addResp.ok) {
        const body = await addResp.text()
        await fetch(`${API_BASE}/tournaments/${tournamentId}.json`, { method: 'DELETE', headers: hdrs })
        throw new Error(`Failed to add participants to Challonge (${addResp.status}): ${body}`)
      }
    }
  }

  return { tournamentId }
}
