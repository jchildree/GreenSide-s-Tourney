import { useEffect, useState } from 'react'
import type { Sync } from '../../shared/types'

const EMPTY_SYNC: Sync = {
  challongeLastPushed: null,
  challongeTournamentId: null,
  googleFormId: null,
  googleFormLastUpdated: null,
}

export function Bracket(): JSX.Element {
  const [sync, setSync] = useState<Sync>(EMPTY_SYNC)
  const [status, setStatus] = useState('')

  useEffect(() => { window.api.getSync().then(setSync) }, [])

  async function handlePush(): Promise<void> {
    setStatus('')
    try {
      await window.api.pushToChallonge()
      setStatus('Pushed to Challonge.')
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`)
    }
  }

  const isError = status.startsWith('Error')

  return (
    <div>
      <h2 className="view-title">Bracket</h2>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <p className="form-label" style={{ marginBottom: '0.25rem' }}>Tournament ID</p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-text)' }}>
            {sync.challongeTournamentId ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>Not set</span>}
          </p>
        </div>
        <div>
          <p className="form-label" style={{ marginBottom: '0.25rem' }}>Last Pushed</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
            {sync.challongeLastPushed ?? <span style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>Never</span>}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={handlePush} className="btn-gold">Push to Challonge</button>
        {status && <span className={isError ? 'status-err' : 'status-ok'}>{status}</span>}
      </div>
    </div>
  )
}
