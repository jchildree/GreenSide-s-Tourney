import { useState, useEffect, useRef } from 'react'

interface PickWheelProps {
  players: string[]
  onSpinComplete: (name: string) => void
  onSpinStart?: () => void
}

const RADIUS = 90
const CENTER = 100

/** Fisher-Yates shuffle returning a new array (mirrors draftModes.ts). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Convert a polar coordinate (degrees, 0 = up, clockwise) to SVG cartesian. */
function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) }
}

/** SVG arc `d` string for wedge `index` of `count` slices. */
function wedgePath(index: number, count: number, radius: number): string {
  if (count <= 1) {
    // Single player: full circle rendered as two arcs.
    const top = polar(0, radius)
    const bottom = polar(180, radius)
    return [
      `M ${top.x} ${top.y}`,
      `A ${radius} ${radius} 0 1 1 ${bottom.x} ${bottom.y}`,
      `A ${radius} ${radius} 0 1 1 ${top.x} ${top.y}`,
      'Z',
    ].join(' ')
  }
  const slice = 360 / count
  const start = index * slice
  const end = start + slice
  const p1 = polar(start, radius)
  const p2 = polar(end, radius)
  const largeArc = slice > 180 ? 1 : 0
  return [
    `M ${CENTER} ${CENTER}`,
    `L ${p1.x} ${p1.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    'Z',
  ].join(' ')
}

/** Angle (degrees, 0 = up) of the midpoint of wedge `index` of `count`. */
function wedgeMidAngle(index: number, count: number): number {
  const slice = 360 / count
  return index * slice + slice / 2
}

function wedgeFill(index: number, count: number): string {
  if (count % 2 === 1 && index === count - 1) return 'var(--color-gold)'
  return index % 2 === 0 ? 'var(--color-primary)' : 'var(--color-card)'
}

/**
 * Visual pie wheel: every remaining player is a wedge. Spin selects a winner
 * (unchanged random logic) and decelerates the wheel so the winner lands under
 * the fixed pointer at the top. Shuffle reorders the wedges.
 */
export function PickWheel({ players, onSpinComplete, onSpinStart }: PickWheelProps): JSX.Element {
  const [order, setOrder] = useState<string[]>(players)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const spinningRef = useRef(false)
  const winnerRef = useRef<string | null>(null)

  // Reset local wedge order whenever the incoming players change.
  useEffect(() => {
    setOrder(players)
  }, [players])

  const empty = order.length === 0
  const count = order.length

  function spin(): void {
    if (empty || spinningRef.current) return
    spinningRef.current = true
    setSpinning(true)
    onSpinStart?.()

    // Unchanged winner selection: uniform random pick over players.
    const winnerIndex = Math.floor(Math.random() * count)
    winnerRef.current = order[winnerIndex]

    const fullTurns = 4 + Math.floor(Math.random() * 3) // 4-6
    const mid = wedgeMidAngle(winnerIndex, count)
    // Land the winner's midpoint under the top pointer.
    const target = rotation + 360 * fullTurns + (360 - mid)
    setRotation(target)
  }

  function handleTransitionEnd(): void {
    if (!spinningRef.current) return
    spinningRef.current = false
    setSpinning(false)
    const winner = winnerRef.current
    winnerRef.current = null
    if (winner != null) onSpinComplete(winner)
  }

  function handleShuffle(): void {
    if (spinningRef.current) return
    setOrder((prev) => shuffle(prev))
  }

  return (
    <div className="pick-wheel">
      {empty ? (
        <div className="pick-wheel__empty">All drafted!</div>
      ) : (
        <>
          <div className="pick-wheel__stage">
            <svg viewBox="0 0 200 200" className="pick-wheel__svg" role="img" aria-label="Draft wheel">
              <g
                className="pick-wheel__rotor"
                data-testid="wheel-rotor"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: '100px 100px',
                  transition: spinning
                    ? 'transform 3s cubic-bezier(0.17, 0.67, 0.16, 0.99)'
                    : 'none',
                }}
              >
                {order.map((name, i) => (
                  <path
                    key={`${name}-${i}`}
                    data-testid="wheel-wedge"
                    d={wedgePath(i, count, RADIUS)}
                    fill={wedgeFill(i, count)}
                    stroke="var(--color-border)"
                    strokeWidth={0.5}
                  />
                ))}
                {order.map((name, i) => {
                  const angle = wedgeMidAngle(i, count)
                  const label = polar(angle, RADIUS * 0.62)
                  return (
                    <text
                      key={`label-${name}-${i}`}
                      data-testid="wheel-label"
                      x={label.x}
                      y={label.y}
                      fill="var(--color-bright, var(--color-bg))"
                      fontSize={count > 8 ? 5 : 7}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${angle} ${label.x} ${label.y})`}
                    >
                      {name.length > 10 ? `${name.slice(0, 9)}...` : name}
                    </text>
                  )
                })}
              </g>
              {/* Fixed pointer at top, outside the rotating group. */}
              <polygon
                className="pick-wheel__pointer"
                points="100,4 92,20 108,20"
                fill="var(--color-gold)"
                stroke="var(--color-border)"
                strokeWidth={0.5}
              />
            </svg>
          </div>

          <div className="pick-wheel__controls">
            <button
              onClick={spin}
              disabled={spinning}
              data-testid="spin-wheel"
              className="pick-wheel__spin"
            >
              {spinning ? 'Spinning...' : 'Spin'}
            </button>
            <button
              onClick={handleShuffle}
              disabled={spinning}
              data-testid="shuffle-wheel"
              className="pick-wheel__shuffle"
            >
              Shuffle
            </button>
            <span className="pick-wheel__badge">{count} left</span>
          </div>
        </>
      )}
    </div>
  )
}
