import { useState } from 'react'

export function Control(): JSX.Element {
  const [status, setStatus] = useState('')

  async function handleUpdateForm(): Promise<void> {
    setStatus('')
    try {
      await window.api.updateGoogleForm()
      setStatus('Google Form updated.')
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`)
    }
  }

  async function handleFetchSignups(): Promise<void> {
    setStatus('')
    try {
      const signups = await window.api.fetchSignups()
      setStatus(`Fetched ${signups.length} signup${signups.length !== 1 ? 's' : ''}.`)
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`)
    }
  }

  const isError = status.startsWith('Error')

  return (
    <div>
      <h2 className="view-title">Tournament Control</h2>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <p className="form-label" style={{ marginBottom: '0.5rem' }}>Google Forms</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleUpdateForm} className="btn-gold">Update Form</button>
            <button onClick={handleFetchSignups} className="btn-ghost">Fetch Signups</button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
          <p className="form-label" style={{ marginBottom: '0.5rem' }}>Challonge</p>
          <button className="btn-gold" disabled>Start Tournament</button>
        </div>
      </div>
      {status && (
        <p className={isError ? 'status-err' : 'status-ok'} style={{ marginTop: '0.75rem' }}>{status}</p>
      )}
    </div>
  )
}
