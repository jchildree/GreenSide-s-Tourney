import { useEffect, useState } from 'react'
import type { Sync } from '../../shared/types'

export function Bracket(): JSX.Element {
  const [sync, setSync] = useState<Sync>({ challongeLastPushed: null, challongeTournamentId: null, googleFormId: null, googleFormLastUpdated: null })
  const [status, setStatus] = useState('')

  useEffect(() => { window.api.getSync().then(setSync) }, [])

  async function handlePush(): Promise<void> {
    try {
      await window.api.pushToChallonge()
      setStatus('Pushed to Challonge.')
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`)
    }
  }

  return (
    <div>
      <h2>Bracket</h2>
      <p>Tournament ID: {sync.challongeTournamentId ?? 'Not set'}</p>
      <p>Last pushed: {sync.challongeLastPushed ?? 'Never'}</p>
      <button onClick={handlePush}>Push to Challonge</button>
      {status && <p>{status}</p>}
    </div>
  )
}
