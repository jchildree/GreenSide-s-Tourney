import { useEffect, useState } from 'react'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { PushChallongeButton } from '../components/PushChallongeButton'

export function Control(): JSX.Element {
  const [formId, setFormId] = useState('')
  const [formIdSaved, setFormIdSaved] = useState(false)
  const [googleStatus, setGoogleStatus] = useState('')

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

  const updateForm = useAsyncAction(async () => {
    await window.api.updateGoogleForm()
    setGoogleStatus('Google Form updated.')
  })

  const fetchSignups = useAsyncAction(async () => {
    const signups = await window.api.fetchSignups()
    setGoogleStatus(`Fetched ${signups.length} signup${signups.length !== 1 ? 's' : ''}.`)
  })

  const googleError = updateForm.error || fetchSignups.error
  const isGoogleError = Boolean(googleError)
  const displayStatus = googleError || googleStatus

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
            <button onClick={updateForm.run} disabled={updateForm.loading} className="btn-gold">
              {updateForm.loading ? 'Updating...' : 'Update Form'}
            </button>
            <button onClick={fetchSignups.run} disabled={fetchSignups.loading} className="btn-ghost">
              {fetchSignups.loading ? 'Fetching...' : 'Fetch Signups'}
            </button>
          </div>
          {displayStatus && (
            <p className={isGoogleError ? 'status-err' : 'status-ok'} style={{ marginTop: '0.5rem' }}>
              {displayStatus}
            </p>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
          <p className="form-label" style={{ marginBottom: '0.5rem' }}>Challonge</p>
          <PushChallongeButton />
        </div>

      </div>
    </div>
  )
}
