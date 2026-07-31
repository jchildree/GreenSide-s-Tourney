import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { CRED } from '../../shared/types'
import { THEMES } from '../theme'
import type { ThemeId } from '../../shared/types'

const CARD: CSSProperties = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.85rem',
  padding: '1.375rem 1.5rem',
}

const EYEBROW: CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-primary)',
}

const PRIMARY_BUTTON: CSSProperties = {
  padding: '0.6rem 1.15rem',
  borderRadius: '0.55rem',
  fontWeight: 700,
  fontSize: '0.85rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: 'var(--color-bg)',
  background: 'linear-gradient(160deg, var(--color-bright, var(--color-primary)) 0%, var(--color-primary) 45%, var(--color-deep, var(--color-primary)) 100%)',
  border: '1px solid var(--color-deep, var(--color-primary))',
}

const GHOST_BUTTON: CSSProperties = {
  padding: '0.6rem 1.15rem',
  borderRadius: '0.55rem',
  fontWeight: 700,
  fontSize: '0.85rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: 'var(--color-silver)',
  background: 'transparent',
  border: '1px solid var(--color-border)',
}

function StatusDot({ on }: { on: boolean }): JSX.Element {
  return (
    <span
      aria-hidden
      style={{
        width: '0.65rem',
        height: '0.65rem',
        borderRadius: '50%',
        flexShrink: 0,
        background: on ? 'var(--color-primary)' : 'var(--color-border)',
        boxShadow: on ? '0 0 6px rgba(var(--glow-rgb), 0.6)' : 'none',
      }}
    />
  )
}

function ServiceRow({
  label,
  desc,
  connected,
  testId,
  onConnect,
  onDisconnect,
  connectLoading,
  connectError,
  disconnectLoading,
}: {
  label: string
  desc: string
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
      gap: '0.875rem',
      padding: '0.875rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      flexWrap: 'wrap',
    }}>
      <StatusDot on={connected === true} />
      <div style={{ flex: 1, minWidth: '12rem' }}>
        <p style={{ margin: 0, fontSize: '1.03rem', fontWeight: 600, color: 'var(--color-text)' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-muted)' }}>{desc}</p>
      </div>
      {connected === null ? (
        <span style={{ fontSize: '0.9rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>Checking…</span>
      ) : (
        <>
          <span
            data-testid={testId}
            style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '6.5rem', color: connected ? 'var(--color-primary)' : 'var(--color-muted)' }}
          >
            {connected ? 'Connected' : 'Not connected'}
          </span>
          {connected ? (
            <button onClick={onDisconnect} disabled={disconnectLoading} style={GHOST_BUTTON}>
              {disconnectLoading ? 'Disconnecting…' : 'Disconnect'}
            </button>
          ) : (
            <button onClick={onConnect} disabled={connectLoading} style={PRIMARY_BUTTON}>
              {connectLoading ? 'Opening browser…' : 'Connect'}
            </button>
          )}
          {connectError && <span className="status-err" style={{ fontSize: '0.85rem' }}>{connectError}</span>}
        </>
      )}
    </div>
  )
}

interface SettingsProps {
  onCleared?: () => void
  theme?: ThemeId
  onThemeChange?: (t: ThemeId) => void
  backgroundUrl?: string | null
  backgroundOpacity?: number
  onBackgroundChange?: (dataUrl: string | null) => void
  onBackgroundOpacityChange?: (value: number) => void
}

export function Settings({
  onCleared,
  theme = 'green',
  onThemeChange,
  backgroundUrl = null,
  backgroundOpacity = 35,
  onBackgroundChange,
  onBackgroundOpacityChange,
}: SettingsProps = {}): JSX.Element {
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [challongeConnected, setChallongeConnected] = useState<boolean | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [opacity, setOpacity] = useState(backgroundOpacity)

  useEffect(() => setOpacity(backgroundOpacity), [backgroundOpacity])

  useEffect(() => {
    void Promise.all([
      window.api.getCredential(CRED.google),
      window.api.getCredential(CRED.challongeRefresh),
    ]).then(([g, c]) => {
      setGoogleConnected(g !== null)
      setChallongeConnected(c !== null)
    })
  }, [])

  const connectGoogle = useAsyncAction(async () => {
    await window.api.beginGoogleOAuth()
    setGoogleConnected((await window.api.getCredential(CRED.google)) !== null)
  })
  const disconnectGoogle = useAsyncAction(async () => {
    await window.api.disconnectGoogle()
    window.location.reload()
  })
  const connectChallonge = useAsyncAction(async () => {
    await window.api.beginChallongeOAuth()
    setChallongeConnected((await window.api.getCredential(CRED.challongeRefresh)) !== null)
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

  const pendingTheme = useRef<ThemeId>(theme)
  const pickTheme = useAsyncAction(async () => {
    await window.api.setTheme(pendingTheme.current)
    onThemeChange?.(pendingTheme.current)
  })

  const chooseBg = useAsyncAction(async () => {
    const dataUrl = await window.api.chooseBackground()
    if (dataUrl !== null) onBackgroundChange?.(dataUrl)
  })
  const removeBg = useAsyncAction(async () => {
    await window.api.removeBackground()
    onBackgroundChange?.(null)
  })

  function commitOpacity(value: number): void {
    setOpacity(value)
    onBackgroundOpacityChange?.(value)
    void window.api.setBackgroundOpacity(value)
  }

  const hasBackground = backgroundUrl !== null

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 700 }}>Settings</h2>
      <p style={{ margin: '0 0 1.5rem', fontSize: '1rem', color: 'var(--color-silver)', textWrap: 'pretty' }}>
        Accounts, appearance and data — everything in plain language.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem', maxWidth: '46rem' }}>
        <div style={CARD}>
          <p style={EYEBROW}>Connected accounts</p>
          <p style={{ margin: '0.375rem 0 0.875rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            These two connections do all the heavy lifting. Green means you&rsquo;re good to go.
          </p>
          <ServiceRow
            label="Google"
            desc="Reads signups and updates your form"
            connected={googleConnected}
            testId="google-status"
            onConnect={connectGoogle.run}
            onDisconnect={disconnectGoogle.run}
            connectLoading={connectGoogle.loading}
            connectError={connectGoogle.error}
            disconnectLoading={disconnectGoogle.loading}
          />
          <ServiceRow
            label="Challonge"
            desc="Creates and runs your bracket"
            connected={challongeConnected}
            testId="challonge-status"
            onConnect={connectChallonge.run}
            onDisconnect={disconnectChallonge.run}
            connectLoading={connectChallonge.loading}
            connectError={connectChallonge.error}
            disconnectLoading={disconnectChallonge.loading}
          />
        </div>

        <div style={CARD}>
          <p style={{ ...EYEBROW, marginBottom: '0.875rem' }}>Appearance</p>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {THEMES.map(t => (
              <button
                key={t.id}
                data-testid={`theme-swatch-${t.id}`}
                title={t.label}
                aria-label={`${t.label} theme`}
                onClick={() => { pendingTheme.current = t.id; void pickTheme.run() }}
                style={{
                  width: '2.375rem',
                  height: '2.375rem',
                  borderRadius: '50%',
                  backgroundColor: t.swatch,
                  border: theme === t.id ? '3px solid var(--color-text)' : '2px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              />
            ))}
            <span style={{ fontSize: '0.95rem', color: 'var(--color-muted)' }}>
              {THEMES.find(t => t.id === theme)?.label} theme
            </span>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '1.25rem 0' }} />

          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-silver)' }}>Background image</p>
          <p style={{ margin: '0.25rem 0 0.875rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            Use your own artwork behind the console. PNG, JPG, WebP or GIF — 1920×1080 or larger looks best.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '8.25rem',
              height: '4.625rem',
              borderRadius: '0.55rem',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              backgroundImage: hasBackground ? `url(${backgroundUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {!hasBackground && <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>No image</span>}
            </div>

            <button
              data-testid="choose-background"
              onClick={chooseBg.run}
              disabled={chooseBg.loading}
              style={PRIMARY_BUTTON}
            >
              {chooseBg.loading ? 'Opening…' : hasBackground ? 'Replace image' : 'Choose image…'}
            </button>

            {hasBackground && (
              <button
                data-testid="remove-background"
                onClick={removeBg.run}
                disabled={removeBg.loading}
                style={GHOST_BUTTON}
              >
                Remove
              </button>
            )}
          </div>

          {hasBackground && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginTop: '1.125rem', maxWidth: '26rem' }}>
                <label htmlFor="bg-strength" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-silver)', minWidth: '7.5rem' }}>
                  Image strength
                </label>
                <input
                  id="bg-strength"
                  data-testid="background-opacity"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={opacity}
                  onChange={e => setOpacity(Number(e.target.value))}
                  onMouseUp={e => commitOpacity(Number((e.target as HTMLInputElement).value))}
                  onKeyUp={e => commitOpacity(Number((e.target as HTMLInputElement).value))}
                  style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                />
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', color: 'var(--color-primary)', minWidth: '2.75rem', textAlign: 'right' }}>
                  {opacity}%
                </span>
              </div>
              <p style={{ margin: '0.625rem 0 0', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                Lower strength keeps text easy to read.
              </p>
            </>
          )}

          {(pickTheme.error || chooseBg.error || removeBg.error) && (
            <p className="status-err" style={{ marginTop: '0.875rem', fontSize: '0.85rem' }}>
              {pickTheme.error || chooseBg.error || removeBg.error}
            </p>
          )}
        </div>

        <div style={CARD}>
          <p style={{ ...EYEBROW, color: '#f87171' }}>Danger zone</p>
          <p style={{ margin: '0.375rem 0 0.875rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            Wipes tournament setup, signups, draft and bracket sync. Your account connections stay. This cannot be undone.
          </p>
          {!confirmingClear ? (
            <button
              data-testid="clear-tournament"
              onClick={() => setConfirmingClear(true)}
              style={{ ...GHOST_BUTTON, color: '#f87171', borderColor: '#f87171' }}
            >
              Clear tournament data
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f87171' }}>Really delete everything?</span>
              <button
                data-testid="confirm-clear"
                onClick={clearTournament.run}
                disabled={clearTournament.loading}
                style={{ ...PRIMARY_BUTTON, background: '#e94560', borderColor: '#e94560', color: '#ffffff' }}
              >
                {clearTournament.loading ? 'Clearing…' : 'Yes, clear it'}
              </button>
              <button onClick={() => setConfirmingClear(false)} disabled={clearTournament.loading} style={GHOST_BUTTON}>
                Cancel
              </button>
              {clearTournament.error && (
                <span className="status-err" style={{ fontSize: '0.85rem' }}>{clearTournament.error}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
