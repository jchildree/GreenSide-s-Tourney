import { performOAuth } from './oauth-flow'

const AUTH_URL = 'https://api.challonge.com/oauth/authorize'
const TOKEN_URL = 'https://api.challonge.com/oauth/token'
const SCOPES = 'me tournaments:read tournaments:write matches:read matches:write participants:read participants:write'
const CALLBACK_PORT = 52431

export const CHALLONGE_REDIRECT_URI = `http://127.0.0.1:${CALLBACK_PORT}/callback`

async function exchangeChallongeCode(opts: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
}): Promise<{ accessToken: string; refreshToken: string }> {
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: opts.code,
      redirect_uri: opts.redirectUri,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
    }),
  })
  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Challonge token exchange failed (${resp.status}): ${body}`)
  }
  const data = (await resp.json()) as { access_token: string; refresh_token: string }
  if (!data.access_token) throw new Error('Challonge did not return an access token')
  if (!data.refresh_token) throw new Error('Challonge did not return a refresh token')
  return { accessToken: data.access_token, refreshToken: data.refresh_token }
}

export async function beginChallongeOAuth(
  clientId: string,
  clientSecret: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  return performOAuth({
    serviceName: 'Challonge',
    port: CALLBACK_PORT,
    buildAuthUrl: (redirectUri, state) => {
      const url = new URL(AUTH_URL)
      url.searchParams.set('client_id', clientId)
      url.searchParams.set('redirect_uri', redirectUri)
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('scope', SCOPES)
      url.searchParams.set('state', state)
      return url.toString()
    },
    exchangeCode: (code, redirectUri) =>
      exchangeChallongeCode({ code, clientId, clientSecret, redirectUri }),
  })
}
