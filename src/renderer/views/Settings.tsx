import { useEffect, useState } from 'react'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { CRED } from '../../shared/types'

function ServiceRow({
  label,
  connected,
  testId,
  onConnect,
  onDisconnect,
  connectLoading,
  connectError,
  disconnectLoading,
}: {
  label: string
  connected: boolean | null
  testId: string
  onConnect: () => void
  onDisconnect: () => void
  connectLoading: boolean
  connectError: string
  disconnectLoading: boolean
}): JSX.Element {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0.75rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--color-text)' }}>{label}</span>
      {connected === null ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>Loading...</span>
      ) : (
        <>
          <span
            data-testid={testId}
            style={{ fontSize: '0.8rem', color: connected ? 'var(--color-primary)' : 'var(--color-muted)', minWidth: '90px' }}
          >
            {connected ? 'Connected' : 'Not connected'}
          </span>
          {connected ? (
            <button
              onClick={onDisconnect}
              disabled={disconnectLoading}
              className="btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
            >
              {disconnectLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={onConnect}
              disabled={connectLoading}
              className="btn-gold"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
            >
              {connectLoading ? 'Opening browser...' : 'Connect'}
            </button>
          )}
          {connectError && (
            <span className="status-err" style={{ fontSize: '0.75rem' }}>{connectError}</span>
          )}
        </>
      )}
    </div>
  )
}

export function Settings(): JSX.Element {
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [challongeConnected, setChallongeConnected] = useState<boolean | null>(null)

  useEffect(() => {
    Promise.all([
      window.api.getCredential(CRED.google),
      window.api.getCredential(CRED.challongeRefresh),
    ]).then(([g, c]) => {
      setGoogleConnected(g !== null)
      setChallongeConnected(c !== null)
    })
  }, [])

  const connectGoogle = useAsyncAction(async () => {
    await window.api.beginGoogleOAuth()
    const cred = await window.api.getCredential(CRED.google)
    setGoogleConnected(cred !== null)
  })

  const disconnectGoogle = useAsyncAction(async () => {
    await window.api.disconnectGoogle()
    window.location.reload()
  })

  const connectChallonge = useAsyncAction(async () => {
    await window.api.beginChallongeOAuth()
    const cred = await window.api.getCredential(CRED.challongeRefresh)
    setChallongeConnected(cred !== null)
  })

  const disconnectChallonge = useAsyncAction(async () => {
    await window.api.disconnectChallonge()
    window.location.reload()
  })

  return (
    <div>
      <h2 className="view-title">Settings</h2>
      <div className="card">
        <p className="form-label" style={{ marginBottom: '0.75rem' }}>Credentials</p>
        <ServiceRow
          label="Google (Forms sync)"
          connected={googleConnected}
          testId="google-status"
          onConnect={connectGoogle.run}
          onDisconnect={disconnectGoogle.run}
          connectLoading={connectGoogle.loading}
          connectError={connectGoogle.error}
          disconnectLoading={disconnectGoogle.loading}
        />
        <ServiceRow
          label="Challonge (bracket)"
          connected={challongeConnected}
          testId="challonge-status"
          onConnect={connectChallonge.run}
          onDisconnect={disconnectChallonge.run}
          connectLoading={connectChallonge.loading}
          connectError={connectChallonge.error}
          disconnectLoading={disconnectChallonge.loading}
        />
      </div>
    </div>
  )
}
