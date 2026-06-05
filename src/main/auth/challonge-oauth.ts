import { randomBytes } from 'node:crypto'
import { shell } from 'electron'
import { startOAuthCallbackServer } from './oauth-callback-server'

const AUTH_URL = 'https://api.challonge.com/oauth/authorize'
const TOKEN_URL = 'https://api.challonge.com/oauth/token'
const SCOPES = 'me tournaments:read tournaments:write matches:read matches:write participants:read participants:write'
const CALLBACK_PORT = 52431

export const CHALLONGE_REDIRECT_URI = `http://127.0.0.1:${CALLBACK_PORT}/callback`

interface TokenResponse {
  access_token: string
  refresh_token: string
}

async function exchangeCode(opts: {
  code: string
  clientId: string
  clientSecret: string
}): Promise<{ accessToken: string; refreshToken: string }> {
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: opts.code,
      redirect_uri: CHALLONGE_REDIRECT_URI,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
    }),
  })
  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Challonge token exchange failed (${resp.status}): ${body}`)
  }
  const data = (await resp.json()) as TokenResponse
  if (!data.access_token) throw new Error('Challonge did not return an access token')
  if (!data.refresh_token) throw new Error('Challonge did not return a refresh token')
  return { accessToken: data.access_token, refreshToken: data.refresh_token }
}

export async function beginChallongeOAuth(
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const state = randomBytes(16).toString('base64url')
  const { waitForCode, shutdown } = await startOAuthCallbackServer({
    port: CALLBACK_PORT,
    serviceName: 'Challonge',
  })

  const authUrl = new URL(AUTH_URL)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', CHALLONGE_REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('state', state)

  try {
    await shell.openExternal(authUrl.toString())
  } catch (err) {
    shutdown()
    throw new Error(`Could not open browser for Challonge sign-in: ${(err as Error).message}`)
  }

  try {
    const code = await waitForCode(state)
    return exchangeCode({ code, clientId, clientSecret })
  } catch (err) {
    shutdown()
    throw err
  }
}
