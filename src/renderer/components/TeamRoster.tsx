import type { Team } from '../../shared/types'

interface TeamRosterProps {
  teams: Team[]
}

export function TeamRoster({ teams }: TeamRosterProps): JSX.Element {
  if (teams.length === 0) {
    return <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No teams assigned yet.</p>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
      {teams.map(team => (
        <div key={team.name} className="card" style={{ borderColor: 'rgba(200, 169, 110, 0.2)' }}>
          <h3 style={{
            color: 'var(--color-gold)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            borderBottom: '1px solid rgba(200, 169, 110, 0.2)',
            paddingBottom: '0.25rem',
          }}>
            {team.name}
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            {team.players.map(p => (
              <li key={p} style={{ color: 'var(--color-silver)', fontSize: '0.875rem' }}>{p}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
