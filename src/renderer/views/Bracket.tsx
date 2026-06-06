import { useEffect, useState } from 'react'
import type { Sync, Draft } from '../../shared/types'
import { PushChallongeButton } from '../components/PushChallongeButton'

const EMPTY_SYNC: Sync = {
  challongeLastPushed: null,
  challongeTournamentId: null,
  googleFormId: null,
  googleFormLastUpdated: null,
}

function formatTs(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleString()
}

export function Bracket(): JSX.Element {
  const [sync, setSync] = useState<Sync>(EMPTY_SYNC)
  const [draft, setDraft] = useState<Draft>({ teams: [], pickOrder: [] })

  useEffect(() => {
    Promise.all([window.api.getSync(), window.api.getDraft()]).then(([s, d]) => {
      setSync(s)
      setDraft(d)
    })
  }, [])

  return (
    <div>
      <h2 className="view-title">Bracket</h2>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <p className="form-label" style={{ marginBottom: '0.25rem' }}>Tournament ID</p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-text)' }}>
            {sync.challongeTournamentId ?? (
              <span style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}>Not set</span>
            )}
          </p>
        </div>
        <div>
          <p className="form-label" style={{ marginBottom: '0.25rem' }}>Last Pushed</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
            {formatTs(sync.challongeLastPushed)}
          </p>
        </div>
        <PushChallongeButton />
      </div>

      {draft.teams.length > 0 && (
        <div className="card">
          <p className="form-label" style={{ marginBottom: '0.75rem' }}>
            Current Roster ({draft.teams.length} teams)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {draft.teams.map(team => (
              <div key={team.name} style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                borderRadius: '4px',
              }}>
                <p style={{
                  margin: '0 0 0.375rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                }}>
                  {team.name}
                </p>
                {team.players.length > 0 ? (
                  <ul style={{ margin: 0, padding: '0 0 0 0.875rem', listStyle: 'disc' }}>
                    {team.players.map(p => (
                      <li key={p} style={{ fontSize: '0.75rem', color: 'var(--color-silver)', lineHeight: 1.6 }}>
                        {p}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>
                    No players
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
