import { useState, useEffect } from 'react'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { CHALLONGE_CREDENTIAL_EXPIRED } from '../../shared/types'

export function PushChallongeButton(): JSX.Element {
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!success) return
    const id = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(id)
  }, [success])

  const { run, loading, error, clearError } = useAsyncAction(async () => {
    await window.api.pushToChallonge()
    setSuccess(true)
  })

  const reconnect = useAsyncAction(async () => {
    await window.api.beginChallongeOAuth()
    clearError()
  })

  const challongeExpired = error.includes(CHALLONGE_CREDENTIAL_EXPIRED)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={run} disabled={loading || challongeExpired} className="btn-gold">
          {loading ? 'Pushing...' : 'Push to Challonge'}
        </button>
        {success && <span className="status-ok">Pushed.</span>}
        {error && !challongeExpired && <span className="status-err">{error}</span>}
      </div>
      {challongeExpired && (
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
            Challonge credentials expired. Reconnect to continue.
          </span>
          <button
            onClick={reconnect.run}
            disabled={reconnect.loading}
            className="btn-gold"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', whiteSpace: 'nowrap' }}
          >
            {reconnect.loading ? 'Opening browser...' : 'Reconnect Challonge'}
          </button>
        </div>
      )}
      {reconnect.error && (
        <span className="status-err" style={{ fontSize: '0.8rem' }}>{reconnect.error}</span>
      )}
    </div>
  )
}
