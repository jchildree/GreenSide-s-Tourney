import { CHALLONGE_CLIENT_ID, CHALLONGE_CLIENT_SECRET } from '../auth/oauth-config'
import type { Draft, Team, Tourney, ChallongeMatch, ChallongeParticipant } from '../../shared/types'
import { CRED } from '../../shared/types'
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
    credService: CRED.challongeRefresh,
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

export async function startTournamentV1(params: { apiKey: string; tournamentId: string }): Promise<void> {
  const { apiKey, tournamentId } = params
  const resp = await fetch(
    `https://api.challonge.com/v1/tournaments/${tournamentId}/start.json?api_key=${apiKey}`,
    { method: 'POST' }
  )
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

export function buildTournamentAttrs(tourney: Tourney): Record<string, unknown> {
  const attrs: Record<string, unknown> = {
    name: tourney.name || 'Tournament',
    tournament_type: tourney.eliminationType === 'double' ? 'double elimination' : 'single elimination',
  }
  if (tourney.game) attrs.game_name = tourney.game
  if (tourney.dateTime) attrs.starts_at = tourney.dateTime
  if (tourney.streamLink) attrs.stream_link = tourney.streamLink

  const maps = tourney.maps ?? []
  const rules = tourney.rules ?? ''
  const parts: string[] = []
  if (maps.length) parts.push(`Maps: ${maps.join(', ')}`)
  if (rules.trim()) parts.push(`Rules:\n${rules}`)
  if (parts.length) attrs.description = parts.join('\n\n')
  return attrs
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
    credService: CRED.challongeRefresh,
  })
  const hdrs = authHeaders(accessToken)

  const attrs = buildTournamentAttrs(tourney)

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

interface FetchMatchesParams {
  refreshToken: string
  tournamentId: string
}

export async function fetchMatches(
  params: FetchMatchesParams
): Promise<{ matches: ChallongeMatch[]; participants: ChallongeParticipant[] }> {
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
    credService: CRED.challongeRefresh,
  })
  const hdrs = authHeaders(accessToken)

  const [matchesResp, partsResp] = await Promise.all([
    fetch(`${API_BASE}/tournaments/${tournamentId}/matches.json`, { headers: hdrs }),
    fetch(`${API_BASE}/tournaments/${tournamentId}/participants.json`, { headers: hdrs }),
  ])

  if (!matchesResp.ok) {
    throw new Error(`Failed to fetch matches (${matchesResp.status}): ${await matchesResp.text()}`)
  }
  if (!partsResp.ok) {
    throw new Error(`Failed to fetch participants (${partsResp.status}): ${await partsResp.text()}`)
  }

  const matchesData = (await matchesResp.json()) as {
    data: Array<{
      id: string
      attributes: {
        state: string
        round: number
        scores_csv: string | null
        winner_id: string | null
        player1_id: string | null
        player2_id: string | null
        suggested_play_order: number | null
      }
    }>
  }
  const partsData = (await partsResp.json()) as {
    data: Array<{ id: string; attributes: { name: string } }>
  }

  const matches: ChallongeMatch[] = matchesData.data.map(m => ({
    id: m.id,
    state: m.attributes.state as ChallongeMatch['state'],
    round: m.attributes.round,
    player1Id: m.attributes.player1_id,
    player2Id: m.attributes.player2_id,
    winnerId: m.attributes.winner_id,
    scoresCsv: m.attributes.scores_csv,
    suggestedPlayOrder: m.attributes.suggested_play_order,
  }))

  const participants: ChallongeParticipant[] = partsData.data.map(p => ({
    id: p.id,
    name: p.attributes.name,
  }))

  return { matches, participants }
}

interface FetchMatchesV1Params {
  apiKey: string
  tournamentId: string
}

export async function fetchMatchesV1(
  params: FetchMatchesV1Params
): Promise<{ matches: ChallongeMatch[]; participants: ChallongeParticipant[] }> {
  const { apiKey, tournamentId } = params
  const base = `https://api.challonge.com/v1/tournaments/${tournamentId}`
  const [matchesResp, partsResp] = await Promise.all([
    fetch(`${base}/matches.json?api_key=${apiKey}`),
    fetch(`${base}/participants.json?api_key=${apiKey}`),
  ])
  if (!matchesResp.ok) {
    throw new Error(`Failed to fetch matches (${matchesResp.status}): ${await matchesResp.text()}`)
  }
  if (!partsResp.ok) {
    throw new Error(`Failed to fetch participants (${partsResp.status}): ${await partsResp.text()}`)
  }

  const matchesData = (await matchesResp.json()) as Array<{
    match: {
      id: number
      state: string
      round: number
      player1_id: number | null
      player2_id: number | null
      winner_id: number | null
      scores_csv: string | null
      suggested_play_order: number | null
    }
  }>
  const partsData = (await partsResp.json()) as Array<{
    participant: { id: number; name: string }
  }>

  const matches: ChallongeMatch[] = matchesData.map(m => ({
    id: String(m.match.id),
    state: m.match.state as ChallongeMatch['state'],
    round: m.match.round,
    player1Id: m.match.player1_id != null ? String(m.match.player1_id) : null,
    player2Id: m.match.player2_id != null ? String(m.match.player2_id) : null,
    winnerId: m.match.winner_id != null ? String(m.match.winner_id) : null,
    scoresCsv: m.match.scores_csv,
    suggestedPlayOrder: m.match.suggested_play_order,
  }))

  const participants: ChallongeParticipant[] = partsData.map(p => ({
    id: String(p.participant.id),
    name: p.participant.name,
  }))

  return { matches, participants }
}

interface UpdateMatchParams {
  refreshToken: string
  tournamentId: string
  matchId: string
  scoresCsv: string
  winnerId: string
}

export async function updateMatch(params: UpdateMatchParams): Promise<void> {
  const { refreshToken, tournamentId, matchId, scoresCsv, winnerId } = params
  if (!CHALLONGE_CLIENT_ID || !CHALLONGE_CLIENT_SECRET) {
    throw new Error('Challonge OAuth credentials not configured in oauth-config.ts')
  }
  const accessToken = await refreshAccessToken({
    tokenUrl: TOKEN_URL,
    clientId: CHALLONGE_CLIENT_ID,
    clientSecret: CHALLONGE_CLIENT_SECRET,
    refreshToken,
    serviceName: 'Challonge',
    credService: CRED.challongeRefresh,
  })
  const hdrs = authHeaders(accessToken)
  const resp = await fetch(`${API_BASE}/tournaments/${tournamentId}/matches/${matchId}.json`, {
    method: 'PUT',
    headers: hdrs,
    body: JSON.stringify({
      data: {
        type: 'match',
        attributes: {
          scores_csv: scoresCsv,
          winner_id: winnerId,
        },
      },
    }),
  })
  if (!resp.ok) {
    throw new Error(`Failed to update match (${resp.status}): ${await resp.text()}`)
  }
}

export async function updateMatchV1(params: {
  apiKey: string
  tournamentId: string
  matchId: string
  scoresCsv: string
  winnerId: string
}): Promise<void> {
  const { apiKey, tournamentId, matchId, scoresCsv, winnerId } = params
  const resp = await fetch(
    `https://api.challonge.com/v1/tournaments/${tournamentId}/matches/${matchId}.json?api_key=${apiKey}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match: { scores_csv: scoresCsv, winner_id: parseInt(winnerId, 10) } }),
    }
  )
  if (!resp.ok) {
    throw new Error(`Failed to update match (${resp.status}): ${await resp.text()}`)
  }
}
