import { useEffect, useRef } from 'react'
import type { PickQueueEntry } from '../../shared/types'

interface PickQueueProps {
  queue: PickQueueEntry[]
  currentIndex: number
}

export function PickQueue({ queue, currentIndex }: PickQueueProps): JSX.Element {
  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentIndex])

  return (
    <div style={{
      maxHeight: '300px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      borderRadius: '4px',
      border: '1px solid rgba(200, 169, 110, 0.2)',
      padding: '4px',
    }}>
      {queue.map((entry, i) => {
        const isCurrent = i === currentIndex
        const isPast = i < currentIndex

        return (
          <div
            key={i}
            ref={isCurrent ? currentRef : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '6px 10px',
              borderRadius: '3px',
              borderLeft: isCurrent ? '3px solid var(--color-gold)' : '3px solid transparent',
              background: isCurrent ? 'rgba(200, 169, 110, 0.12)' : 'transparent',
              opacity: isPast ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <span style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'rgba(200, 169, 110, 0.5)',
              minWidth: '2rem',
              textAlign: 'right',
            }}>
              #{entry.pickNumber}
            </span>
            <span style={{
              flex: 1,
              fontSize: '0.875rem',
              color: isCurrent ? 'var(--color-gold)' : 'inherit',
              fontWeight: isCurrent ? 600 : 400,
            }}>
              {entry.teamName}
            </span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'rgba(200, 169, 110, 0.5)',
            }}>
              R{entry.round}
            </span>
          </div>
        )
      })}
      {queue.length === 0 && (
        <div style={{
          padding: '1rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'rgba(200, 169, 110, 0.4)',
        }}>
          No picks queued
        </div>
      )}
    </div>
  )
}
