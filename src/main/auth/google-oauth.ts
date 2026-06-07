import { createHash, randomBytes } from 'node:crypto'
import { performOAuth } from './oauth-flow'

const SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
].join(' ')

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth'

export function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = randomBytes(96).toString('base64url').slice(0, 128)
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

async function exchangeGoogleCode(opts: {
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
  const data = (await resp.json()) as { access_token: string; refresh_token?: string }
  if (!data.refresh_token) {
    throw new Error('Google did not return a refresh token. Ensure offline access and prompt=consent are set.')
  }
  return { accessToken: data.access_token, refreshToken: data.refresh_token }
}

export async function beginGoogleOAuth(
  clientId: string,
  clientSecret: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { verifier, challenge } = generatePKCE()
  return performOAuth({
    serviceName: 'Google',
    buildAuthUrl: (redirectUri, state) => {
      const url = new URL(AUTH_BASE)
      url.searchParams.set('client_id', clientId)
      url.searchParams.set('redirect_uri', redirectUri)
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('scope', SCOPES)
      url.searchParams.set('code_challenge', challenge)
      url.searchParams.set('code_challenge_method', 'S256')
      url.searchParams.set('access_type', 'offline')
      url.searchParams.set('prompt', 'consent')
      url.searchParams.set('state', state)
      return url.toString()
    },
    exchangeCode: (code, redirectUri) =>
      exchangeGoogleCode({ code, verifier, clientId, clientSecret, redirectUri }),
  })
}
