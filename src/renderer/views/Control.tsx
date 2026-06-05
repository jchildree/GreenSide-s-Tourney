import { useEffect, useState } from 'react'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { PushChallongeButton } from '../components/PushChallongeButton'
import type { Sync, Signups } from '../../shared/types'

function formatTs(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString()
}

function formViewUrl(formId: string): string {
  return `https://docs.google.com/forms/d/${formId}/viewform`
}

export function Control(): JSX.Element {
  const [formId, setFormId] = useState('')
  const [formIdSaved, setFormIdSaved] = useState(false)
  const [sync, setSync] = useState<Sync | null>(null)
  const [signups, setSignups] = useState<Signups>([])
  const [actionStatus, setActionStatus] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    Promise.all([window.api.getSync(), window.api.getSignups()]).then(([s, sg]) => {
      setSync(s)
      setSignups(sg)
      if (s.googleFormId) setFormId(s.googleFormId)
    })
  }, [])

  async function handleSaveFormId(): Promise<void> {
    await window.api.setGoogleFormId(formId)
    setSync(s => s ? { ...s, googleFormId: formId.trim() || null } : s)
    setFormIdSaved(true)
    setTimeout(() => setFormIdSaved(false), 2000)
  }

  const updateForm = useAsyncAction(async () => {
    await window.api.updateGoogleForm()
    const s = await window.api.getSync()
    setSync(s)
    setActionError('')
    setActionStatus('Form updated.')
  })

  const fetchSignups = useAsyncAction(async () => {
    const sg = await window.api.fetchSignups()
    setSignups(sg)
    setActionError('')
    setActionStatus(`${sg.length} signup${sg.length !== 1 ? 's' : ''} fetched.`)
  })

  useEffect(() => {
    const errorMsg = updateForm.error || fetchSignups.error
    if (errorMsg) setActionError(errorMsg)
  }, [updateForm.error, fetchSignups.error])

  const googleExpired = actionError.includes('GOOGLE_CREDENTIAL_EXPIRED')

  const reconnectGoogle = useAsyncAction(async () => {
    await window.api.beginGoogleOAuth()
    setActionError('')
    setActionStatus('Google reconnected.')
  })

  const activeFormId = sync?.googleFormId ?? formId.trim()

  return (
    <div>
      <h2 className="view-title">Tournament Control</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p className="form-label" style={{ margin: 0 }}>Google Form</p>

          <div>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: '0.375rem' }}>
              Form ID - from URL: docs.google.com/forms/d/<strong style={{ color: 'var(--color-silver)' }}>FORM_ID</strong>/edit
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                className="form-input"
                type="text"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                value={formId}
                onChange={e => setFormId(e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
              <button onClick={handleSaveFormId} className="btn-ghost">
                {formIdSaved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>

          {activeFormId && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(34, 197, 94, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
              borderRadius: '4px',
            }}>
              <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formViewUrl(activeFormId)}
              </span>
              <button
                onClick={() => window.api.openExternal(formViewUrl(activeFormId))}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}
              >
                Open Form
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
            <div style={{ color: 'var(--color-muted)' }}>
              <span>Signups: </span>
              <span style={{ color: signups.length > 0 ? 'var(--color-primary)' : 'var(--color-muted)', fontWeight: 600 }}>
                {signups.length}
              </span>
            </div>
            <div style={{ color: 'var(--color-muted)' }}>
              <span>Form updated: </span>
              <span style={{ color: 'var(--color-silver)' }}>
                {formatTs(sync?.googleFormLastUpdated ?? null)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={updateForm.run} disabled={updateForm.loading || !activeFormId || googleExpired} className="btn-gold">
              {updateForm.loading ? 'Updating...' : 'Update Form'}
            </button>
            <button onClick={fetchSignups.run} disabled={fetchSignups.loading || !activeFormId || googleExpired} className="btn-ghost">
              {fetchSignups.loading ? 'Fetching...' : 'Fetch Signups'}
            </button>
            {actionStatus && !actionError && (
              <span className="status-ok" style={{ fontSize: '0.8rem' }}>{actionStatus}</span>
            )}
          </div>

          {googleExpired && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.75rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '4px',
            }}>
              <span style={{ color: '#f87171', fontSize: '0.8rem', flex: 1 }}>
                Google credentials expired. Reconnect to continue.
              </span>
              <button
                onClick={reconnectGoogle.run}
                disabled={reconnectGoogle.loading}
                className="btn-gold"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', whiteSpace: 'nowrap' }}
              >
                {reconnectGoogle.loading ? 'Opening browser...' : 'Reconnect Google'}
              </button>
            </div>
          )}
          {!googleExpired && actionError && (
            <span className="status-err" style={{ fontSize: '0.8rem' }}>{actionError}</span>
          )}

          {signups.length > 0 && (
            <div style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '0.75rem',
              maxHeight: '180px',
              overflowY: 'auto',
            }}>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.7rem', marginBottom: '0.375rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Signups
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {signups.map((p, i) => (
                  <div key={p.name} style={{ display: 'flex', gap: '0.75rem', padding: '3px 0', fontSize: '0.8rem' }}>
                    <span style={{ color: 'rgba(34, 197, 94, 0.4)', fontFamily: 'monospace', minWidth: '1.5rem', textAlign: 'right' }}>
                      {i + 1}
                    </span>
                    <span style={{ color: 'var(--color-silver)', flex: 1 }}>{p.name}</span>
                    <span style={{ color: 'var(--color-muted)' }}>{p.discordHandle}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <p className="form-label" style={{ marginBottom: '0.75rem' }}>Challonge</p>
          {sync?.challongeLastPushed && (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
              Last pushed: <span style={{ color: 'var(--color-silver)' }}>{formatTs(sync.challongeLastPushed)}</span>
            </p>
          )}
          <PushChallongeButton />
        </div>

      </div>
    </div>
  )
}
