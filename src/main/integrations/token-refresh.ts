interface TokenRefreshOpts {
  tokenUrl: string
  clientId: string
  clientSecret: string
  refreshToken: string
  serviceName: string
}

export async function refreshAccessToken(opts: TokenRefreshOpts): Promise<string> {
  const resp = await fetch(opts.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: opts.refreshToken,
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
    }),
  })
  if (!resp.ok) {
    const body = await resp.text()
    try {
      const parsed = JSON.parse(body) as { error?: string }
      if (parsed.error === 'invalid_grant') {
        throw new Error(`${opts.serviceName.toUpperCase()}_CREDENTIAL_EXPIRED`)
      }
    } catch (e) {
      if ((e as Error).message.endsWith('_CREDENTIAL_EXPIRED')) throw e
    }
    throw new Error(`${opts.serviceName} token refresh failed (${resp.status}): ${body}`)
  }
  const data = (await resp.json()) as { access_token: string }
  if (!data.access_token) throw new Error(`${opts.serviceName} did not return an access token`)
  return data.access_token
}
