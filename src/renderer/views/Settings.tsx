import { useEffect, useState } from 'react'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { CRED } from '../../shared/types'
import { THEMES } from '../theme'
import type { ThemeId } from '../../shared/types'

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

interface SettingsProps {
  onCleared?: () => void
  theme?: ThemeId
  onThemeChange?: (t: ThemeId) => void
  backgroundSet?: boolean
  onBackgroundChange?: (dataUrl: string | null) => void
}

export function Settings({ onCleared, theme = 'green', onThemeChange, backgroundSet = false, onBackgroundChange }: SettingsProps = {}): JSX.Element {
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [challongeConnected, setChallongeConnected] = useState<boolean | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)

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

  const clearTournament = useAsyncAction(async () => {
    await window.api.clearTournament()
    setConfirmingClear(false)
    onCleared?.()
  })

  const pickTheme = async (t: ThemeId): Promise<void> => {
    await window.api.setTheme(t)
    onThemeChange?.(t)
  }

  const chooseBg = useAsyncAction(async () => {
    const dataUrl = await window.api.chooseBackground()
    if (dataUrl !== null) onBackgroundChange?.(dataUrl)
  })

  const removeBg = useAsyncAction(async () => {
    await window.api.removeBackground()
    onBackgroundChange?.(null)
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
      <div className="card" style={{ marginTop: '1rem' }}>
        <p className="form-label" style={{ marginBottom: '0.75rem' }}>Appearance</p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              data-testid={`theme-swatch-${t.id}`}
              title={t.label}
              onClick={() => void pickTheme(t.id)}
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '50%',
                backgroundColor: t.swatch,
                border: theme === t.id ? '3px solid var(--color-text)' : '2px solid var(--color-border)',
                cursor: 'pointer',
              }}
            />
          ))}
          <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
            {THEMES.find(t => t.id === theme)?.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
          <button
            className="btn-ghost"
            data-testid="choose-background"
            onClick={chooseBg.run}
            disabled={chooseBg.loading}
            style={{ fontSize: '0.8rem' }}
          >
            {chooseBg.loading ? 'Opening...' : backgroundSet ? 'Change Background Image' : 'Choose Background Image'}
          </button>
          {backgroundSet && (
            <button
              className="btn-ghost"
              data-testid="remove-background"
              onClick={removeBg.run}
              disabled={removeBg.loading}
              style={{ fontSize: '0.8rem' }}
            >
              Remove Background
            </button>
          )}
          {(chooseBg.error || removeBg.error) && (
            <span className="status-err" style={{ fontSize: '0.75rem' }}>{chooseBg.error || removeBg.error}</span>
          )}
        </div>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <p className="form-label" style={{ marginBottom: '0.75rem' }}>Tournament Data</p>
        {!confirmingClear ? (
          <button
            className="btn-ghost"
            data-testid="clear-tournament"
            onClick={() => setConfirmingClear(true)}
            style={{ fontSize: '0.8rem' }}
          >
            Clear Tournament Data
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', margin: 0 }}>
              Deletes tourney setup, signups, draft, and sync state. Credentials are kept.
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                className="btn-gold"
                data-testid="confirm-clear"
                onClick={clearTournament.run}
                disabled={clearTournament.loading}
                style={{ fontSize: '0.8rem', color: '#f87171', borderColor: '#f87171' }}
              >
                {clearTournament.loading ? 'Clearing...' : 'Confirm Clear'}
              </button>
              <button
                className="btn-ghost"
                onClick={() => setConfirmingClear(false)}
                disabled={clearTournament.loading}
                style={{ fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              {clearTournament.error && (
                <span className="status-err" style={{ fontSize: '0.75rem' }}>{clearTournament.error}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
