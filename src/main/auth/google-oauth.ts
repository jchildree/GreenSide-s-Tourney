import { createHash, randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { shell } from 'electron'

const SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
].join(' ')

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth'
const OAUTH_TIMEOUT_MS = 5 * 60 * 1000

function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = randomBytes(96).toString('base64url').slice(0, 128)
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

function startCallbackServer(): Promise<{
  port: number
  waitForCode: (expectedState: string) => Promise<string>
  shutdown: () => void
}> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to bind loopback server'))
        return
      }
      const port = addr.port

      const shutdown = (): void => {
        server.close()
        ;(server as any).closeAllConnections?.()
      }

      const waitForCode = (expectedState: string): Promise<string> =>
        new Promise<string>((codeResolve, codeReject) => {
          let settled = false

          const settle = (fn: () => void): void => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            server.close()
            ;(server as any).closeAllConnections?.()
            fn()
          }

          const timer = setTimeout(() => {
            settle(() => codeReject(new Error('OAuth timed out — no redirect received within 5 minutes')))
          }, OAUTH_TIMEOUT_MS)

          server.on('request', (req, res) => {
            const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`)
            if (!url.pathname.startsWith('/callback')) {
              res.writeHead(404).end()
              return
            }
            const receivedState = url.searchParams.get('state')
            if (receivedState !== expectedState) {
              res.writeHead(400).end()
              settle(() => codeReject(new Error('OAuth state mismatch — possible CSRF attack')))
              return
            }
            const code = url.searchParams.get('code')
            const error = url.searchParams.get('error')
            const isError = error !== null

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(
              '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">' +
              (isError
                ? '<h2>Authorization failed. Please close this tab and try again in Tourney App.</h2>'
                : '<h2>Connected! You can close this tab and return to Tourney App.</h2>') +
              '</body></html>'
            )

            if (isError) {
              const safeError = (error ?? '').replace(/[^\w_-]/g, '').slice(0, 64)
              settle(() => codeReject(new Error(`Google denied access: ${safeError}`)))
            } else if (!code) {
              settle(() => codeReject(new Error('OAuth redirect missing code parameter')))
            } else {
              settle(() => codeResolve(code))
            }
          })
        })

      resolve({ port, waitForCode, shutdown })
    })

    server.on('error', reject)
  })
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
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
  const { port, waitForCode, shutdown } = await startCallbackServer()
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
  authUrl.searchParams.set('state', state)  // CSRF nonce (I2)

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
