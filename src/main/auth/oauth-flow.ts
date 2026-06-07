import { randomBytes } from 'node:crypto'
import { shell } from 'electron'
import { startOAuthCallbackServer } from './oauth-callback-server'

export interface PerformOAuthOpts {
  serviceName: string
  port?: number
  buildAuthUrl: (redirectUri: string, state: string) => string
  exchangeCode: (code: string, redirectUri: string) => Promise<{ accessToken: string; refreshToken: string }>
}

export async function performOAuth(opts: PerformOAuthOpts): Promise<{ accessToken: string; refreshToken: string }> {
  const { serviceName, port, buildAuthUrl, exchangeCode } = opts
  const state = randomBytes(16).toString('base64url')
  const { port: boundPort, waitForCode, shutdown } = await startOAuthCallbackServer({ port, serviceName })
  const redirectUri = `http://127.0.0.1:${boundPort}/callback`
  const authUrl = buildAuthUrl(redirectUri, state)

  try {
    await shell.openExternal(authUrl)
  } catch (err) {
    shutdown()
    throw new Error(`Could not open browser for ${serviceName} sign-in: ${(err as Error).message}`)
  }

  try {
    const code = await waitForCode(state)
    return await exchangeCode(code, redirectUri)
  } catch (err) {
    shutdown()
    throw err
  }
}
