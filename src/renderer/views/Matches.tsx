import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ChallongeMatch, ChallongeParticipant } from '../../shared/types'
import { CHALLONGE_CREDENTIAL_EXPIRED } from '../../shared/types'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { CARD, EYEBROW, GHOST_BUTTON, PRIMARY_BUTTON, VIEW_INTRO, VIEW_TITLE, disabledIf } from '../components/ui'

type MatchesData = { matches: ChallongeMatch[]; participants: ChallongeParticipant[] }

const SCORE_INPUT: CSSProperties = {
  width: '3.6rem',
  textAlign: 'center',
  padding: '0.5rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.5rem',
  color: 'var(--color-text)',
  fontSize: '1rem',
  fontVariantNumeric: 'tabular-nums',
}

const ROW: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
  padding: '0.7rem 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  flexWrap: 'wrap',
}

const TEAM_NAME: CSSProperties = {
  minWidth: '7rem',
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--color-text)',
}

function MatchRow({
  match,
  participantMap,
  onUpdated,
}: {
  match: ChallongeMatch
  participantMap: Map<string, string>
  onUpdated: () => void
}): JSX.Element {
  const [p1Score, setP1Score] = useState('')
  const [p2Score, setP2Score] = useState('')

  const name1 = match.player1Id ? (participantMap.get(match.player1Id) ?? 'TBD') : 'TBD'
  const name2 = match.player2Id ? (participantMap.get(match.player2Id) ?? 'TBD') : 'TBD'
  const winnerName = match.winnerId ? (participantMap.get(match.winnerId) ?? match.winnerId) : null

  const submit = useAsyncAction(async () => {
    const n1 = parseInt(p1Score, 10)
    const n2 = parseInt(p2Score, 10)
    if (isNaN(n1) || isNaN(n2)) throw new Error('Enter a score for both teams.')
    if (n1 < 0 || n2 < 0) throw new Error('Scores can’t be negative.')
    if (n1 === n2) throw new Error('It’s a tie — one team needs the higher score.')
    const winnerId = n1 > n2 ? match.player1Id : match.player2Id
    if (!winnerId) throw new Error('This match doesn’t have both teams yet.')
    await window.api.updateMatch(match.id, `${n1}-${n2}`, winnerId)
    onUpdated()
  })

  if (match.state === 'pending') {
    return (
      <div style={{ ...ROW, opacity: 0.5 }}>
        <span style={{ fontSize: '0.95rem', color: 'var(--color-muted)' }}>
          {match.suggestedPlayOrder != null ? `Match ${match.suggestedPlayOrder} — ` : ''}
          waiting on the earlier round
        </span>
      </div>
    )
  }

  if (match.state === 'complete') {
    return (
      <div style={{ ...ROW, opacity: 0.75 }}>
        <span style={{ ...TEAM_NAME, color: winnerName === name1 ? 'var(--color-bright, var(--color-primary))' : 'var(--color-text)' }}>
          {name1}
        </span>
        <span style={{ fontSize: '0.95rem', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {match.scoresCsv ?? '—'}
        </span>
        <span style={{ ...TEAM_NAME, color: winnerName === name2 ? 'var(--color-bright, var(--color-primary))' : 'var(--color-text)' }}>
          {name2}
        </span>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', marginLeft: 'auto' }}>
          ✓ {winnerName ?? 'No winner'}
        </span>
      </div>
    )
  }

  const ready = p1Score !== '' && p2Score !== ''

  return (
    <div style={ROW}>
      <span style={TEAM_NAME}>{name1}</span>
      <input
        type="number"
        min={0}
        value={p1Score}
        onChange={e => setP1Score(e.target.value)}
        style={SCORE_INPUT}
        placeholder="0"
        aria-label={`Score for ${name1}`}
      />
      <span style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>vs</span>
      <input
        type="number"
        min={0}
        value={p2Score}
        onChange={e => setP2Score(e.target.value)}
        style={SCORE_INPUT}
        placeholder="0"
        aria-label={`Score for ${name2}`}
      />
      <span style={TEAM_NAME}>{name2}</span>
      <button
        onClick={submit.run}
        disabled={submit.loading || !ready}
        style={disabledIf(!ready, { ...PRIMARY_BUTTON, padding: '0.5rem 1.1rem', fontSize: '0.85rem' })}
      >
        {submit.loading ? 'Saving…' : 'Submit'}
      </button>
      {submit.error && (
        <span className="status-err" style={{ fontSize: '0.9rem' }}>{submit.error}</span>
      )}
    </div>
  )
}

/** Step 5 — score entry, one card per round. */
export function Matches(): JSX.Element {
  const [data, setData] = useState<MatchesData | null>(null)
  const [loadError, setLoadError] = useState('')

  function load(): void {
    setLoadError('')
    window.api.getMatches()
      .then(setData)
      .catch((e: Error) => setLoadError(e.message))
  }

  useEffect(load, [])

  const rounds = data
    ? Array.from(new Set(data.matches.map(m => m.round))).sort((a, b) => a - b)
    : []

  const participantMap = data
    ? new Map(data.participants.map(p => [p.id, p.name]))
    : new Map<string, string>()

  const isAuthError =
    loadError.includes('re-authenticate in Settings') || loadError === CHALLONGE_CREDENTIAL_EXPIRED

  function roundTitle(round: number, index: number): string {
    if (index === rounds.length - 1) return `Round ${round} · Final`
    if (index === rounds.length - 2) return `Round ${round} · Semifinals`
    return `Round ${round}`
  }

  return (
    <div>
      <h2 style={VIEW_TITLE}>Step 5 · Live matches</h2>
      <p style={VIEW_INTRO}>Enter scores as matches finish — Challonge updates instantly.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem', maxWidth: '52rem' }}>
        {isAuthError && (
          <div style={CARD}>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-silver)', lineHeight: 1.5 }}>
              Challonge isn&rsquo;t connected. Open <strong>Settings</strong>, reconnect your Challonge account, then come
              back here.
            </p>
          </div>
        )}

        {loadError && !isAuthError && (
          <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span className="status-err" style={{ flex: 1, fontSize: '0.95rem' }}>{loadError}</span>
            <button onClick={load} style={GHOST_BUTTON}>Try again</button>
          </div>
        )}

        {!data && !loadError && (
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-muted)' }}>Loading matches…</p>
        )}

        {data && rounds.length === 0 && (
          <div style={CARD}>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-silver)', lineHeight: 1.5 }}>
              No matches yet. Finish <strong>Step 4 · Publish &amp; go live</strong> first — push your teams to Challonge
              and start the tournament.
            </p>
          </div>
        )}

        {rounds.map((round, i) => (
          <div key={round} style={CARD}>
            <p style={{ ...EYEBROW, marginBottom: '0.625rem' }}>{roundTitle(round, i)}</p>
            {data!.matches
              .filter(m => m.round === round)
              .sort((a, b) => (a.suggestedPlayOrder ?? 0) - (b.suggestedPlayOrder ?? 0))
              .map(match => (
                <MatchRow key={match.id} match={match} participantMap={participantMap} onUpdated={load} />
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
