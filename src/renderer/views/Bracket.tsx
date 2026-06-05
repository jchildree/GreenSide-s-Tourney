import { useEffect, useState } from 'react'
import type { Sync } from '../../shared/types'
import { PushChallongeButton } from '../components/PushChallongeButton'

const EMPTY_SYNC: Sync = {
  challongeLastPushed: null,
  challongeTournamentId: null,
  googleFormId: null,
  googleFormLastUpdated: null,
}

export function Bracket(): JSX.Element {
  const [sync, setSync] = useState<Sync>(EMPTY_SYNC)

  useEffect(() => { window.api.getSync().then(setSync) }, [])

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
      <PushChallongeButton />
    </div>
  )
}
