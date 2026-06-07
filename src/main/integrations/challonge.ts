import { CHALLONGE_CLIENT_ID, CHALLONGE_CLIENT_SECRET } from '../auth/oauth-config'
import type { Draft, Team, Tourney } from '../../shared/types'
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

interface StartParams {
  refreshToken: string
  tournamentId: string
}

export async function startTournament(params: StartParams): Promise<void> {
  const { refreshToken, tournamentId } = params
  if (!CHALLONGE_CLIENT_ID || !CHALLONGE_CLIENT_SECRET) {
    throw new Error('Challonge OAuth credentials not configured in oauth-config.ts')
  }
  const accessToken = await refreshAccessToken({
    tokenUrl: TOKEN_URL,
    clientId: CHALLONGE_CLIENT_ID,
    clientSecret: CHALLONGE_CLIENT_SECRET,
    refreshToken,
    serviceName: 'Challonge',
  })
  const hdrs = authHeaders(accessToken)
  const resp = await fetch(`${API_BASE}/tournaments/${tournamentId}/start.json`, {
    method: 'POST',
    headers: hdrs,
  })
  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Failed to start tournament (${resp.status}): ${body}`)
  }
}

async function syncParticipants(
  tournamentId: string,
  teams: Team[],
  hdrs: Record<string, string>
): Promise<void> {
  const listResp = await fetch(`${API_BASE}/tournaments/${tournamentId}/participants.json`, {
    headers: hdrs,
  })
  if (!listResp.ok) {
    throw new Error(`Failed to fetch participants (${listResp.status}): ${await listResp.text()}`)
  }
  const listData = (await listResp.json()) as { data: { id: string }[] }

  for (const p of listData.data ?? []) {
    const delResp = await fetch(
      `${API_BASE}/tournaments/${tournamentId}/participants/${p.id}.json`,
      { method: 'DELETE', headers: hdrs }
    )
    if (!delResp.ok) {
      throw new Error(`Failed to remove participant ${p.id} (${delResp.status}): ${await delResp.text()}`)
    }
  }

  // No rollback on bulk_add failure: tournament will have no participants until next push
  if (teams.length > 0) {
    const addResp = await fetch(`${API_BASE}/tournaments/${tournamentId}/participants/bulk_add.json`, {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({ data: { type: 'Participants', attributes: { participants: teams.map(t => ({ name: t.name })) } } }),
    })
    if (!addResp.ok) {
      throw new Error(`Failed to re-add participants (${addResp.status}): ${await addResp.text()}`)
    }
  }
}

export async function pushToChallonge(params: PushParams): Promise<{ tournamentId: string }> {
  const { refreshToken, tournamentId: existingId, draft, tourney } = params
  if (!CHALLONGE_CLIENT_ID || !CHALLONGE_CLIENT_SECRET) {
    throw new Error('Challonge OAuth credentials not configured in oauth-config.ts')
  }
  const accessToken = await refreshAccessToken({
    tokenUrl: TOKEN_URL,
    clientId: CHALLONGE_CLIENT_ID,
    clientSecret: CHALLONGE_CLIENT_SECRET,
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
  if (tourney.streamLink) attrs.stream_link = tourney.streamLink

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
  }

  if (existingId) {
    await syncParticipants(tournamentId, draft.teams, hdrs)
  } else if (draft.teams.length > 0) {
    const addResp = await fetch(`${API_BASE}/tournaments/${tournamentId}/participants/bulk_add.json`, {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({ data: { type: 'Participants', attributes: { participants: draft.teams.map(t => ({ name: t.name })) } } }),
    })
    if (!addResp.ok) {
      const body = await addResp.text()
      const rollbackResp = await fetch(`${API_BASE}/tournaments/${tournamentId}.json`, { method: 'DELETE', headers: hdrs })
      if (!rollbackResp.ok) {
        throw new Error(
          `Failed to add participants to Challonge (${addResp.status}): ${body} -- rollback DELETE also failed (${rollbackResp.status}), tournament ${tournamentId} may still exist on Challonge`
        )
      }
      throw new Error(`Failed to add participants to Challonge (${addResp.status}): ${body}`)
    }
  }

  return { tournamentId }
}
