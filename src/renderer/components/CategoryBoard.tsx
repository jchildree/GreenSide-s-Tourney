import type { CSSProperties } from 'react'
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core'
import { PlayerCard } from './PlayerCard'
import { PickWheel } from './PickWheel'
import type { Player, DraftPick } from '../../shared/types'

const POOL_ID = 'pool'
const CAT_PREFIX = 'cat:'

interface CategoryBoardProps {
  players: Player[]
  categories: string[]
  categoryOf: Record<string, string>
  teamNames: string[]
  picks: DraftPick[]
  activeCategory: string
  onSetActive: (category: string) => void
  onAssign: (player: string, category: string | null) => void
  onWinner: (category: string, player: string) => void
}

export function CategoryBoard({
  players,
  categories,
  categoryOf,
  teamNames,
  picks,
  activeCategory,
  onSetActive,
  onAssign,
  onWinner,
}: CategoryBoardProps): JSX.Element {
  const unassigned = players.filter(p => !categoryOf[p.name])
  const membersOf = (label: string): Player[] => players.filter(p => categoryOf[p.name] === label)
  const drafted = new Set(picks.map(p => p.playerName))
  const teamsFilledFor = (label: string): Set<string> =>
    new Set(picks.filter(p => categoryOf[p.playerName] === label).map(p => p.teamName))
  const nextTeamFor = (label: string): string | null => {
    const filled = teamsFilledFor(label)
    return teamNames.find(t => !filled.has(t)) ?? null
  }

  const activeMembers = membersOf(activeCategory).filter(p => !drafted.has(p.name))
  const activeNext = nextTeamFor(activeCategory)

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (!over) return
    const player = active.id as string
    const target = over.id as string
    if (target === POOL_ID) onAssign(player, null)
    else if (target.startsWith(CAT_PREFIX)) onAssign(player, target.slice(CAT_PREFIX.length))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map(label => {
              const done = teamsFilledFor(label).size >= teamNames.length && teamNames.length > 0
              return (
                <button
                  key={label}
                  onClick={() => onSetActive(label)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    color: label === activeCategory ? 'var(--color-gold)' : done ? 'var(--color-primary)' : 'var(--color-muted)',
                    background: label === activeCategory ? 'var(--color-card)' : 'transparent',
                    border: `2px solid ${label === activeCategory ? 'var(--color-gold)' : 'var(--color-border)'}`,
                  }}
                >
                  {label} {teamsFilledFor(label).size}/{teamNames.length}{done ? ' ok' : ''}
                </button>
              )
            })}
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-silver)' }}>
            {activeMembers.length === 0
              ? `Category ${activeCategory} has no one left to draw.`
              : activeNext
                ? `Spin to give ${activeNext} its category ${activeCategory} player.`
                : `Every team already has a category ${activeCategory} player.`}
          </p>
        </div>

        {activeMembers.length > 0 && activeNext && (
          <PickWheel
            players={activeMembers.map(p => p.name)}
            onSpinComplete={name => onWinner(activeCategory, name)}
          />
        )}
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(14rem, 17rem) 1fr', gap: '1.125rem', alignItems: 'start' }}>
          <Bucket id={POOL_ID} title={`Unassigned - ${unassigned.length}`}>
            {unassigned.length === 0
              ? <Empty text="Everyone is bucketed." />
              : unassigned.map(p => <DraggablePlayer key={p.name} player={p} />)}
          </Bucket>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${categories.length}, 1fr)`, gap: '0.875rem' }}>
            {categories.map(label => {
              const members = membersOf(label)
              const full = members.length >= teamNames.length
              return (
                <Bucket
                  key={label}
                  id={`${CAT_PREFIX}${label}`}
                  title={`Category ${label} - ${members.length}/${teamNames.length}`}
                  accent={full}
                  active={label === activeCategory}
                  onSelect={() => onSetActive(label)}
                >
                  {members.length === 0
                    ? <Empty text="Drag players here." />
                    : members.map(p => (
                      <DraggablePlayer key={p.name} player={p} pick={picks.find(pk => pk.playerName === p.name)} />
                    ))}
                </Bucket>
              )
            })}
          </div>
        </div>
      </DndContext>
    </div>
  )
}

interface BucketProps {
  id: string
  title: string
  accent?: boolean
  active?: boolean
  onSelect?: () => void
  children: React.ReactNode
}

function Bucket({ id, title, accent, active, onSelect, children }: BucketProps): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id })
  const border = isOver || active ? 'var(--color-gold)' : accent ? 'rgba(var(--glow-rgb), 0.45)' : 'var(--color-border)'
  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${border}`,
        borderRadius: '0.8rem',
        padding: '0.85rem',
        minHeight: '10rem',
        transition: 'border-color 150ms',
      }}
    >
      <p
        onClick={onSelect}
        style={{
          margin: '0 0 0.6rem',
          color: active ? 'var(--color-gold)' : 'var(--color-muted)',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: onSelect ? 'pointer' : 'default',
        }}
      >
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>{children}</div>
    </div>
  )
}

function Empty({ text }: { text: string }): JSX.Element {
  return <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>{text}</p>
}

function DraggablePlayer({ player, pick }: { player: Player; pick?: DraftPick }): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: player.name })
  const style: CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : {}
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <PlayerCard player={player} assigned={!!pick} teamName={pick?.teamName} draggable style={style} />
    </div>
  )
}
