import { createHash, randomBytes } from 'node:crypto'
import { shell } from 'electron'
import { startOAuthCallbackServer } from './oauth-callback-server'

const SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
].join(' ')

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth'

function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = randomBytes(96).toString('base64url').slice(0, 128)
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
}

async function exchangeCode(opts: {
  code: string
  verifier: string
  clientId: string
  clientSecret: string
  redirectUri: string
}): Promise<{ accessToken: string; refreshToken: string }> {
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: opts.code,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: opts.verifier,
    }),
  })
  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Token exchange failed (${resp.status}): ${body}`)
  }
  const data = (await resp.json()) as TokenResponse
  if (!data.refresh_token) {
    throw new Error('Google did not return a refresh token. Ensure offline access and prompt=consent are set.')
  }
  return { accessToken: data.access_token, refreshToken: data.refresh_token }
}

export async function beginGoogleOAuth(
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const { verifier, challenge } = generatePKCE()
  const state = randomBytes(16).toString('base64url')
  const { port, waitForCode, shutdown } = await startOAuthCallbackServer({ serviceName: 'Google' })
  const redirectUri = `http://127.0.0.1:${port}/callback`

  const authUrl = new URL(AUTH_BASE)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('code_challenge', challenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', state)

  try {
    await shell.openExternal(authUrl.toString())
  } catch (err) {
    shutdown()
    throw new Error(`Could not open browser for Google sign-in: ${(err as Error).message}`)
  }

  try {
    const code = await waitForCode(state)
    return exchangeCode({ code, verifier, clientId, clientSecret, redirectUri })
  } catch (err) {
    shutdown()
    throw err
  }
}

export { generatePKCE }
