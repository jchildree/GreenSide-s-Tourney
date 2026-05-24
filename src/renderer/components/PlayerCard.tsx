import type { Player } from '../../shared/types'

interface PlayerCardProps {
  player: Player
  assigned?: boolean
  teamName?: string
  draggable?: boolean
  style?: React.CSSProperties
  onClick?: () => void
}

export function PlayerCard({ player, assigned, teamName, draggable, style, onClick }: PlayerCardProps): JSX.Element {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.4rem',
        overflow: 'hidden',
        cursor: draggable ? 'grab' : onClick ? 'pointer' : 'default',
        userSelect: 'none',
        boxShadow: draggable ? '0 0 0 1px var(--color-gold)' : 'none',
        ...style,
      }}
    >
      {/* Left accent bar */}
      <div style={{
        width: '3px',
        flexShrink: 0,
        backgroundColor: assigned ? 'var(--color-gold)' : 'var(--color-muted)',
      }} />
      {/* Content */}
      <div style={{ flex: 1, padding: '0.5rem 0.6rem' }}>
        <div style={{ color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: 600 }}>
          {player.name}
        </div>
        <div style={{ color: 'var(--color-muted)', fontSize: '0.72rem', marginTop: '0.1rem' }}>
          {player.discordHandle.startsWith('@') ? player.discordHandle : `@${player.discordHandle}`}
        </div>
      </div>
      {/* Badge */}
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: '0.5rem' }}>
        <span style={{
          fontSize: '0.62rem',
          padding: '0.15rem 0.4rem',
          borderRadius: '999px',
          backgroundColor: assigned ? 'var(--color-gold)' : 'var(--color-surface)',
          color: assigned ? '#020817' : 'var(--color-muted)',
          whiteSpace: 'nowrap',
        }}>
          {assigned && teamName ? teamName : 'Unassigned'}
        </span>
      </div>
    </div>
  )
}
