import type { Team } from '../../shared/types'

interface TeamRosterProps {
  teams: Team[]
}

export function TeamRoster({ teams }: TeamRosterProps): JSX.Element {
  if (teams.length === 0) {
    return <p>No teams assigned yet.</p>
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {teams.map(team => (
        <div key={team.name} style={{ border: '1px solid #ccc', padding: '0.5rem', minWidth: '120px' }}>
          <strong>{team.name}</strong>
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {team.players.map(p => <li key={p}>{p}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}
