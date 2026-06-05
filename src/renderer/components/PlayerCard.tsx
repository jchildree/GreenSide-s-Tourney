import { useState } from 'react'
import type { Player } from '../../shared/types'

interface PlayerCardProps {
  player: Player
  assigned?: boolean
  teamName?: string
  draggable?: boolean
  style?: React.CSSProperties
}

export function PlayerCard({
  player,
  assigned = false,
  teamName,
  draggable = false,
  style,
}: PlayerCardProps): JSX.Element {
  const [hovered, setHovered] = useState(false)

  const discordDisplay = player.discordHandle.startsWith('@')
    ? player.discordHandle
    : `@${player.discordHandle}`

  // A player is visually "assigned" only when both assigned=true AND teamName is provided.
  // assigned=true without teamName falls back to the unassigned display to avoid a gold
  // badge that says "Unassigned" (contradictory).
  const isVisuallyAssigned = assigned && teamName != null

  const accentColor = isVisuallyAssigned ? 'var(--color-gold)' : 'var(--color-muted)'

  const badgeBg = isVisuallyAssigned ? 'var(--color-gold)' : 'var(--color-surface)'
  const badgeColor = isVisuallyAssigned ? '#1a1a1a' : 'var(--color-muted)'
  const badgeLabel = isVisuallyAssigned ? teamName : 'Unassigned'

  const boxShadow = draggable && hovered ? '0 0 0 1px var(--color-gold)' : 'none'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        minHeight: '80px',
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.4rem',
        overflow: 'hidden',
        boxShadow,
        cursor: draggable ? 'grab' : 'default',
        boxSizing: 'border-box',
        position: 'relative',
        ...style,
      }}
      onMouseEnter={draggable ? () => setHovered(true) : undefined}
      onMouseLeave={draggable ? () => setHovered(false) : undefined}
    >
      {/* Left accent bar */}
      <div
        style={{
          width: '3px',
          flexShrink: 0,
          background: accentColor,
        }}
      />

      {/* Card body */}
      <div
        style={{
          flex: 1,
          padding: '0.5rem 0.625rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '0.125rem',
          minWidth: 0,
        }}
      >
        <span
          style={{
            color: 'var(--color-text)',
            fontSize: '0.875rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {player.name}
        </span>
        <span
          style={{
            color: 'var(--color-muted)',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {discordDisplay}
        </span>
      </div>

      {/* Assignment badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.375rem',
          right: '0.5rem',
          background: badgeBg,
          color: badgeColor,
          fontSize: '0.65rem',
          fontWeight: 600,
          padding: '0.1rem 0.4rem',
          borderRadius: '9999px',
          letterSpacing: '0.03em',
          maxWidth: '8rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {badgeLabel}
      </div>
    </div>
  )
}
