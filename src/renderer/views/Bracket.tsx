import { useEffect, useState } from 'react'
import { CHALLONGE_CREDENTIAL_EXPIRED, type Draft, type Sync } from '../../shared/types'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { ReconnectBanner } from '../components/ReconnectBanner'
import { CARD, EYEBROW, PRIMARY_BUTTON, VIEW_INTRO, VIEW_TITLE, disabledIf, stepBubble } from '../components/ui'

const EMPTY_SYNC: Sync = {
  challongeLastPushed: null,
  challongeTournamentId: null,
  googleFormId: null,
  googleFormLastUpdated: null,
  tournamentStartedAt: null,
}

function formatTs(iso: string | null): string {
  if (!iso) return 'never'
  return new Date(iso).toLocaleString()
}

interface BracketProps {
  onChanged?: () => void
}

/** Step 4 — two numbered actions, the second gated on the first. */
export function Bracket({ onChanged }: BracketProps = {}): JSX.Element {
  const [sync, setSync] = useState<Sync>(EMPTY_SYNC)
  const [draft, setDraft] = useState<Draft>({ teams: [], pickOrder: [] })
  const [pushedJustNow, setPushedJustNow] = useState(false)

  useEffect(() => {
    void Promise.all([window.api.getSync(), window.api.getDraft()]).then(([s, d]) => {
      setSync(s)
      setDraft(d)
    })
  }, [])

  const push = useAsyncAction(async () => {
    await window.api.pushToChallonge()
    setSync(await window.api.getSync())
    setPushedJustNow(true)
    onChanged?.()
  })

  const start = useAsyncAction(async () => {
    await window.api.startTournament()
    setSync(await window.api.getSync())
    onChanged?.()
  })

  const reconnect = useAsyncAction(async () => {
    await window.api.beginChallongeOAuth()
    push.clearError()
    start.clearError()
  })

  useEffect(() => {
    if (!pushedJustNow) return
    const id = setTimeout(() => setPushedJustNow(false), 3000)
    return () => clearTimeout(id)
  }, [pushedJustNow])

  const expired =
    push.error.includes(CHALLONGE_CREDENTIAL_EXPIRED) || start.error.includes(CHALLONGE_CREDENTIAL_EXPIRED)
  const isPushed = sync.challongeTournamentId !== null
  const isStarted = sync.tournamentStartedAt !== null
  const teamCount = draft.teams.length

  return (
    <div>
      <h2 style={VIEW_TITLE}>Step 4 · Publish &amp; go live</h2>
      <p style={VIEW_INTRO}>
        Send your teams to Challonge, then start the tournament when everyone&rsquo;s ready.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem', maxWidth: '48rem' }}>
        <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: '1.125rem', flexWrap: 'wrap' }}>
          <span style={stepBubble(isPushed)}>{isPushed ? '✓' : '1'}</span>
          <div style={{ flex: 1, minWidth: '15rem' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Push teams to Challonge
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-muted)' }}>
              {isPushed
                ? `Last pushed ${formatTs(sync.challongeLastPushed)} · bracket ${sync.challongeTournamentId}`
                : `Creates the bracket and adds ${teamCount || 'your'} team${teamCount === 1 ? '' : 's'} as participants.`}
            </p>
          </div>
          <button
            onClick={push.run}
            disabled={push.loading || expired}
            data-testid="push-challonge"
            style={disabledIf(expired, PRIMARY_BUTTON)}
          >
            {push.loading ? 'Pushing…' : isPushed ? 'Push again' : 'Push to Challonge'}
          </button>
          {pushedJustNow && <span className="status-ok" style={{ fontSize: '0.95rem' }}>✓ Pushed</span>}
        </div>

        <div style={{
          ...CARD,
          display: 'flex',
          alignItems: 'center',
          gap: '1.125rem',
          flexWrap: 'wrap',
          opacity: isPushed ? 1 : 0.5,
        }}>
          <span style={stepBubble(isStarted)}>{isStarted ? '✓' : '2'}</span>
          <div style={{ flex: 1, minWidth: '15rem' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Start the tournament
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-muted)' }}>
              {isStarted
                ? `Started ${formatTs(sync.tournamentStartedAt)} — good luck!`
                : isPushed
                  ? 'Locks the bracket and opens round 1 on Challonge.'
                  : 'Push your teams first.'}
            </p>
          </div>
          <button
            onClick={start.run}
            disabled={!isPushed || isStarted || start.loading || expired}
            data-testid="start-tournament"
            style={disabledIf(!isPushed || isStarted || expired, PRIMARY_BUTTON)}
          >
            {start.loading ? 'Starting…' : isStarted ? '✓ Live' : 'Start tournament'}
          </button>
        </div>

        {expired && (
          <ReconnectBanner service="Challonge" onReconnect={reconnect.run} loading={reconnect.loading} />
        )}
        {!expired && (push.error || start.error) && (
          <p className="status-err" style={{ margin: 0, fontSize: '0.95rem' }}>{push.error || start.error}</p>
        )}
        {reconnect.error && (
          <p className="status-err" style={{ margin: 0, fontSize: '0.95rem' }}>{reconnect.error}</p>
        )}

        {isStarted && (
          <div style={{
            background: 'rgba(var(--glow-rgb), 0.08)',
            border: '1px solid rgba(var(--glow-rgb), 0.3)',
            borderRadius: '0.6rem',
            padding: '0.875rem 1.125rem',
            fontSize: '0.95rem',
            color: 'var(--color-bright, var(--color-primary))',
            lineHeight: 1.5,
          }}>
            Tournament is live. Head to <strong>Step 5 · Live matches</strong> to enter scores — and remember to close
            signups in Google Forms.
          </div>
        )}

        {teamCount > 0 && (
          <div style={CARD}>
            <p style={{ ...EYEBROW, marginBottom: '0.875rem' }}>Roster preview · {teamCount} teams</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))', gap: '0.75rem' }}>
              {draft.teams.map(team => (
                <div key={team.name} style={{
                  padding: '0.7rem 0.875rem',
                  border: '1px solid rgba(var(--glow-rgb), 0.2)',
                  borderRadius: '0.55rem',
                }}>
                  <p style={{ margin: '0 0 0.375rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {team.name}
                  </p>
                  {team.players.length > 0 ? (
                    <ul style={{ margin: 0, padding: '0 0 0 1rem', listStyle: 'disc' }}>
                      {team.players.map(p => (
                        <li key={p} style={{ fontSize: '0.9rem', color: 'var(--color-silver)', lineHeight: 1.65 }}>{p}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>
                      No players yet
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
