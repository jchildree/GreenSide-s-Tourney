import { CHALLONGE_CLIENT_ID, CHALLONGE_CLIENT_SECRET } from '../auth/oauth-config'
import type { Draft, Tourney } from '../../shared/types'

const API_BASE = 'https://api.challonge.com/v2.1'
const TOKEN_URL = 'https://api.challonge.com/oauth/token'

async function getAccessToken(refreshToken: string): Promise<string> {
  if (!CHALLONGE_CLIENT_ID || !CHALLONGE_CLIENT_SECRET) {
    throw new Error('Challonge OAuth credentials not configured in oauth-config.ts')
  }
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CHALLONGE_CLIENT_ID,
      client_secret: CHALLONGE_CLIENT_SECRET,
    }),
  })
  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Challonge token refresh failed (${resp.status}): ${body}`)
  }
  const data = (await resp.json()) as { access_token: string }
  if (!data.access_token) throw new Error('Challonge did not return an access token')
  return data.access_token
}

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
  const { refreshToken, draft, tourney } = params
  const accessToken = await getAccessToken(refreshToken)
  const hdrs = authHeaders(accessToken)

  const attrs: Record<string, unknown> = {
    name: tourney.name || 'Tournament',
    tournament_type: 'single elimination',
  }
  if (tourney.game) attrs.game_name = tourney.game
  if (tourney.dateTime) attrs.starts_at = tourney.dateTime

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
  const tournamentId = createData.data.id

  if (draft.teams.length > 0) {
    const participants = draft.teams.map(t => ({ name: t.name }))
    const addResp = await fetch(`${API_BASE}/tournaments/${tournamentId}/participants/bulk_add.json`, {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({
        data: {
          type: 'Participants',
          attributes: { participants },
        },
      }),
    })

    if (!addResp.ok) {
      const body = await addResp.text()
      throw new Error(`Failed to add participants to Challonge (${addResp.status}): ${body}`)
    }
  }

  return { tournamentId }
}
