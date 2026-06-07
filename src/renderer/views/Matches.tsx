import { useEffect, useState } from 'react'
import type { ChallongeMatch, ChallongeParticipant } from '../../shared/types'
import { useAsyncAction } from '../hooks/useAsyncAction'

type MatchesData = { matches: ChallongeMatch[]; participants: ChallongeParticipant[] }

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
    if (isNaN(n1) || isNaN(n2)) throw new Error('Enter valid scores')
    if (n1 < 0 || n2 < 0) throw new Error('Scores must be non-negative')
    if (n1 === n2) throw new Error('Scores are tied -- enter different scores to declare a winner')
    const winnerId = n1 > n2 ? match.player1Id : match.player2Id
    if (!winnerId) throw new Error('Winner participant ID missing')
    await window.api.updateMatch(match.id, `${n1}-${n2}`, winnerId)
    onUpdated()
  })

  const rowBase: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    flexWrap: 'wrap',
  }

  if (match.state === 'pending') {
    return (
      <div style={{ ...rowBase, opacity: 0.45 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>
          {match.suggestedPlayOrder != null ? `Match ${match.suggestedPlayOrder}: ` : ''}Waiting for earlier round
        </span>
      </div>
    )
  }

  if (match.state === 'complete') {
    return (
      <div style={rowBase}>
        <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--color-text)' }}>
          {name1} vs {name2}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{match.scoresCsv ?? '-'}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>
          {winnerName ?? 'No winner'}
        </span>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '52px',
    textAlign: 'center',
    padding: '0.25rem',
    background: 'var(--color-bg)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '4px',
    color: 'var(--color-text)',
    fontSize: '0.875rem',
  }

  return (
    <div style={rowBase}>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', minWidth: '120px' }}>{name1}</span>
      <input
        type="number"
        min={0}
        value={p1Score}
        onChange={e => setP1Score(e.target.value)}
        style={inputStyle}
        placeholder="0"
      />
      <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>vs</span>
      <input
        type="number"
        min={0}
        value={p2Score}
        onChange={e => setP2Score(e.target.value)}
        style={inputStyle}
        placeholder="0"
      />
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', minWidth: '120px' }}>{name2}</span>
      <button
        onClick={submit.run}
        disabled={submit.loading || !p1Score || !p2Score}
        className="btn-gold"
        style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
      >
        {submit.loading ? 'Saving...' : 'Submit'}
      </button>
      {submit.error && (
        <span className="status-err" style={{ fontSize: '0.75rem' }}>{submit.error}</span>
      )}
    </div>
  )
}

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

  return (
    <div>
      <h2 className="view-title">Matches</h2>

      {loadError && (
        <div className="card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="status-err">{loadError}</span>
          <button
            onClick={load}
            className="btn-gold"
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {!data && !loadError && (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Loading matches...</p>
      )}

      {data && rounds.length === 0 && (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          No matches found. Push to Challonge and start the tournament first.
        </p>
      )}

      {rounds.map(round => (
        <div key={round} className="card" style={{ marginBottom: '1rem' }}>
          <p className="form-label" style={{ marginBottom: '0.5rem' }}>Round {round}</p>
          {data!.matches
            .filter(m => m.round === round)
            .sort((a, b) => (a.suggestedPlayOrder ?? 0) - (b.suggestedPlayOrder ?? 0))
            .map(match => (
              <MatchRow
                key={match.id}
                match={match}
                participantMap={participantMap}
                onUpdated={load}
              />
            ))}
        </div>
      ))}
    </div>
  )
}
