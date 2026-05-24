import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { shell } from 'electron'

const AUTH_URL = 'https://api.challonge.com/oauth/authorize'
const TOKEN_URL = 'https://api.challonge.com/oauth/token'
const SCOPES = 'me tournaments:read tournaments:write matches:read matches:write participants:read participants:write'
const CALLBACK_PORT = 52431
const REDIRECT_URI = `http://127.0.0.1:${CALLBACK_PORT}/callback`
const OAUTH_TIMEOUT_MS = 5 * 60 * 1000

export const CHALLONGE_REDIRECT_URI = REDIRECT_URI

function startCallbackServer(): Promise<{
  waitForCode: (expectedState: string) => Promise<string>
  shutdown: () => void
}> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(CALLBACK_PORT, '127.0.0.1', () => {
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
            settle(() => codeReject(new Error('Challonge OAuth timed out — no redirect received within 5 minutes')))
          }, OAUTH_TIMEOUT_MS)

          server.on('request', (req, res) => {
            const url = new URL(req.url ?? '/', `http://127.0.0.1:${CALLBACK_PORT}`)
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
              settle(() => codeReject(new Error(`Challonge denied access: ${safeError}`)))
            } else if (!code) {
              settle(() => codeReject(new Error('OAuth redirect missing code parameter')))
            } else {
              settle(() => codeResolve(code))
            }
          })
        })

      resolve({ waitForCode, shutdown })
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${CALLBACK_PORT} is already in use. Close other applications and try again.`))
      } else {
        reject(err)
      }
    })
  })
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
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
      redirect_uri: REDIRECT_URI,
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
  const { waitForCode, shutdown } = await startCallbackServer()

  const authUrl = new URL(AUTH_URL)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
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
