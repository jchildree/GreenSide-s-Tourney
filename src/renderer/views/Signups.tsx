import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { GOOGLE_CREDENTIAL_EXPIRED, type Signups as SignupList, type Sync } from '../../shared/types'

/**
 * Step 2 — everything about the Google Form and its responses, lifted out of
 * the old Control view so the flow reads as one step per screen.
 */

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
  padding: '0.65rem 1.25rem',
  borderRadius: '0.6rem',
  fontWeight: 700,
  fontSize: '0.9rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: 'var(--color-bg)',
  background: 'linear-gradient(160deg, var(--color-bright, var(--color-primary)) 0%, var(--color-primary) 45%, var(--color-deep, var(--color-primary)) 100%)',
  border: '1px solid var(--color-deep, var(--color-primary))',
  boxShadow: '0 0 14px rgba(var(--glow-rgb), 0.4)',
}

const GHOST_BUTTON: CSSProperties = {
  padding: '0.65rem 1.25rem',
  borderRadius: '0.6rem',
  fontWeight: 700,
  fontSize: '0.9rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: 'var(--color-silver)',
  background: 'transparent',
  border: '1px solid var(--color-border)',
}

function formViewUrl(formId: string): string {
  return `https://docs.google.com/forms/d/${formId}/viewform`
}

interface SignupsProps {
  onChanged?: () => void
}

export function Signups({ onChanged }: SignupsProps = {}): JSX.Element {
  const [formId, setFormId] = useState('')
  const [formIdSaved, setFormIdSaved] = useState(false)
  const [sync, setSync] = useState<Sync | null>(null)
  const [signups, setSignups] = useState<SignupList>([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void Promise.all([window.api.getSync(), window.api.getSignups()]).then(([s, sg]) => {
      setSync(s)
      setSignups(sg)
      if (s.googleFormId) setFormId(s.googleFormId)
    })
  }, [])

  const activeFormId = sync?.googleFormId ?? formId.trim()
  const googleExpired = error.includes(GOOGLE_CREDENTIAL_EXPIRED)

  async function handleSaveFormId(): Promise<void> {
    await window.api.setGoogleFormId(formId)
    setSync(s => (s ? { ...s, googleFormId: formId.trim() || null } : s))
    setFormIdSaved(true)
    setTimeout(() => setFormIdSaved(false), 2000)
  }

  const updateForm = useAsyncAction(async () => {
    await window.api.updateGoogleForm()
    setSync(await window.api.getSync())
    setError('')
    setStatus('Your form now shows the latest tournament details.')
  })

  const fetchSignups = useAsyncAction(async () => {
    const sg = await window.api.fetchSignups()
    setSignups(sg)
    setError('')
    setStatus(`${sg.length} signup${sg.length !== 1 ? 's' : ''} pulled in.`)
    onChanged?.()
  })

  const reconnectGoogle = useAsyncAction(async () => {
    await window.api.beginGoogleOAuth()
    setError('')
    setStatus('Google reconnected.')
  })

  useEffect(() => {
    const msg = updateForm.error || fetchSignups.error
    if (msg) setError(msg)
  }, [updateForm.error, fetchSignups.error])

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 700 }}>Step 2 · Collect signups</h2>
      <p style={{ margin: '0 0 1.5rem', fontSize: '1rem', color: 'var(--color-silver)', textWrap: 'pretty' }}>
        Share your Google Form with players, then pull their responses in here.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(22rem, 1fr))', gap: '1.125rem', alignItems: 'start' }}>
        <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <p style={EYEBROW}>Your signup form</p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>
              Form ID — the long code in your form&rsquo;s web address
            </span>
            <span style={{ display: 'flex', gap: '0.625rem' }}>
              <input
                className="form-input"
                type="text"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                value={formId}
                onChange={e => setFormId(e.target.value)}
                style={{ flex: 1, fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', minHeight: '2.5rem' }}
              />
              <button onClick={handleSaveFormId} style={GHOST_BUTTON}>
                {formIdSaved ? 'Saved' : 'Save'}
              </button>
            </span>
          </label>

          {activeFormId && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.55rem',
              padding: '0.7rem 0.875rem',
            }}>
              <span style={{
                flex: 1,
                fontSize: '0.875rem',
                color: 'var(--color-silver)',
                fontFamily: 'ui-monospace, monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {formViewUrl(activeFormId)}
              </span>
              <button
                onClick={() => void window.api.openExternal(formViewUrl(activeFormId))}
                style={{ ...GHOST_BUTTON, padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                Open
              </button>
            </div>
          )}

          <button
            onClick={updateForm.run}
            disabled={updateForm.loading || !activeFormId || googleExpired}
            style={{ ...GHOST_BUTTON, alignSelf: 'flex-start', opacity: !activeFormId || googleExpired ? 0.45 : 1 }}
          >
            {updateForm.loading ? 'Updating…' : 'Update form details'}
          </button>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
            This writes your tournament name, game and dates onto the form — so you never have to edit the form by hand.
          </p>
        </div>

        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
            <p style={{ ...EYEBROW, flex: 1 }}>Signups · {signups.length}</p>
            <button
              onClick={fetchSignups.run}
              disabled={fetchSignups.loading || !activeFormId || googleExpired}
              data-testid="fetch-signups"
              style={{ ...PRIMARY_BUTTON, opacity: !activeFormId || googleExpired ? 0.45 : 1 }}
            >
              {fetchSignups.loading ? 'Fetching…' : signups.length > 0 ? 'Refresh' : 'Fetch signups'}
            </button>
          </div>

          {signups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '21rem', overflowY: 'auto' }}>
              {signups.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    display: 'flex',
                    gap: '0.875rem',
                    alignItems: 'center',
                    padding: '0.5rem 0.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.85rem',
                    color: 'rgba(var(--glow-rgb), 0.55)',
                    minWidth: '1.5rem',
                    textAlign: 'right',
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.97rem', fontWeight: 600, color: 'var(--color-text)' }}>{p.name}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{p.discordHandle}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-muted)' }}>
              No signups yet — press &ldquo;Fetch signups&rdquo; once players have filled in the form.
            </p>
          )}
        </div>
      </div>

      {googleExpired && (
        <div style={{
          marginTop: '1.125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          padding: '0.875rem 1rem',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.6rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ color: '#f87171', fontSize: '0.95rem', flex: 1 }}>
            Your Google connection expired. Reconnect to keep going.
          </span>
          <button onClick={reconnectGoogle.run} disabled={reconnectGoogle.loading} style={PRIMARY_BUTTON}>
            {reconnectGoogle.loading ? 'Opening browser…' : 'Reconnect Google'}
          </button>
        </div>
      )}

      {!googleExpired && error && (
        <p className="status-err" style={{ marginTop: '1rem', fontSize: '0.95rem' }}>{error}</p>
      )}
      {status && !error && (
        <p className="status-ok" style={{ marginTop: '1rem', fontSize: '0.95rem' }}>{status}</p>
      )}
    </div>
  )
}
