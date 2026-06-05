import { useState } from 'react'
import { useAsyncAction } from '../hooks/useAsyncAction'

export function PushChallongeButton(): JSX.Element {
  const [success, setSuccess] = useState(false)

  const { run, loading, error } = useAsyncAction(async () => {
    await window.api.pushToChallonge()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button onClick={run} disabled={loading} className="btn-gold">
        {loading ? 'Pushing...' : 'Push to Challonge'}
      </button>
      {success && <span className="status-ok">Pushed.</span>}
      {error && <span className="status-err">{error}</span>}
    </div>
  )
}
