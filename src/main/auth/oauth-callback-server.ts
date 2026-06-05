import { createServer } from 'node:http'

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000

export interface OAuthCallbackServerOpts {
  port?: number
  serviceName?: string
  timeoutMs?: number
}

export interface OAuthCallbackServer {
  port: number
  waitForCode: (expectedState: string) => Promise<string>
  shutdown: () => void
}

export function startOAuthCallbackServer(opts: OAuthCallbackServerOpts = {}): Promise<OAuthCallbackServer> {
  const { port: requestedPort = 0, serviceName = 'OAuth', timeoutMs = DEFAULT_TIMEOUT_MS } = opts

  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(requestedPort, '127.0.0.1', () => {
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
            settle(() => codeReject(new Error(`${serviceName} OAuth timed out -- no redirect received within 5 minutes`)))
          }, timeoutMs)

          server.on('request', (req, res) => {
            const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`)
            if (!url.pathname.startsWith('/callback')) {
              res.writeHead(404).end()
              return
            }
            const receivedState = url.searchParams.get('state')
            if (receivedState !== expectedState) {
              res.writeHead(400).end()
              settle(() => codeReject(new Error('OAuth state mismatch -- possible CSRF attack')))
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
              settle(() => codeReject(new Error(`${serviceName} denied access: ${safeError}`)))
            } else if (!code) {
              settle(() => codeReject(new Error('OAuth redirect missing code parameter')))
            } else {
              settle(() => codeResolve(code))
            }
          })
        })

      resolve({ port, waitForCode, shutdown })
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${requestedPort} is already in use. Close other applications and try again.`))
      } else {
        reject(err)
      }
    })
  })
}
