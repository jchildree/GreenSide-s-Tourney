import { useEffect, useState } from 'react'

export function Control(): JSX.Element {
  const [formId, setFormId] = useState('')
  const [formIdSaved, setFormIdSaved] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    window.api.getSync().then(s => {
      if (s.googleFormId) setFormId(s.googleFormId)
    })
  }, [])

  async function handleSaveFormId(): Promise<void> {
    await window.api.setGoogleFormId(formId)
    setFormIdSaved(true)
    setTimeout(() => setFormIdSaved(false), 2000)
  }

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
          <p className="form-label" style={{ marginBottom: '0.5rem' }}>Google Form ID</p>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
            Paste the ID from your form URL: docs.google.com/forms/d/<strong style={{ color: 'var(--color-silver)' }}>FORM_ID</strong>/edit
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              className="form-input"
              type="text"
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              value={formId}
              onChange={e => setFormId(e.target.value)}
              style={{ flex: 1 }}
            />
            <button onClick={handleSaveFormId} className="btn-ghost">
              {formIdSaved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
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
