import { useState, useEffect, useRef, type TransitionEvent } from 'react'

interface PickWheelProps {
  players: string[]
  onSpinComplete: (name: string) => void
  onSpinStart?: () => void
}

const RADIUS = 90
const CENTER = 100
const REVEAL_MS = 900

let tickCtx: AudioContext | null = null

/** Short square-wave click, the peg-against-flapper tick of a spinning wheel. */
function playTick(): void {
  try {
    tickCtx = tickCtx ?? new AudioContext()
    const ctx = tickCtx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 1100
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.025)
  } catch {
    // audio not available in test environments
  }
}

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

function wedgeFill(index: number, winnerIdx: number | null): string {
  if (index === winnerIdx) return 'var(--color-gold)'
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
  const winnerIndexRef = useRef(-1)
  const rotorRef = useRef<SVGGElement | null>(null)
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null)

  // Reset local wedge order whenever the incoming players change.
  useEffect(() => {
    setOrder(players)
    setWinnerIdx(null)
  }, [players])

  useEffect(() => () => { if (revealTimerRef.current) clearTimeout(revealTimerRef.current) }, [])

  const empty = order.length === 0
  const count = order.length

  function startTicking(sliceCount: number): void {
    let lastSlice = -1
    const step = (): void => {
      if (!spinningRef.current) return
      const node = rotorRef.current
      try {
        if (node && typeof DOMMatrixReadOnly !== 'undefined') {
          const t = getComputedStyle(node).transform
          if (t && t !== 'none') {
            const m = new DOMMatrixReadOnly(t)
            const ang = (Math.atan2(m.b, m.a) * 180) / Math.PI
            const topSlice = Math.floor((((360 - ang) % 360) / (360 / sliceCount)) % sliceCount)
            if (topSlice !== lastSlice) {
              if (lastSlice !== -1) playTick()
              lastSlice = topSlice
            }
          }
        }
      } catch {
        // getComputedStyle/DOMMatrix unavailable (e.g. test env) -- skip ticks.
      }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  function spin(): void {
    if (empty || spinningRef.current) return
    if (revealTimerRef.current) { clearTimeout(revealTimerRef.current); revealTimerRef.current = null }
    setWinnerIdx(null)
    spinningRef.current = true
    setSpinning(true)
    onSpinStart?.()

    // Unchanged winner selection: uniform random pick over players.
    const winnerIndex = Math.floor(Math.random() * count)
    winnerRef.current = order[winnerIndex]
    winnerIndexRef.current = winnerIndex

    const fullTurns = 4 + Math.floor(Math.random() * 3) // 4-6
    const mid = wedgeMidAngle(winnerIndex, count)
    // Measure the landing angle from the wheel's current resting angle, else the
    // accumulated rotation drifts the winner off the caret on every spin but the first.
    const current = ((rotation % 360) + 360) % 360
    const toTop = ((360 - mid - current) % 360 + 360) % 360
    const target = rotation + 360 * fullTurns + toTop
    setRotation(target)
    startTicking(count)
  }

  function handleTransitionEnd(e: TransitionEvent<SVGGElement>): void {
    if (e.propertyName !== 'transform' || !spinningRef.current) return
    spinningRef.current = false
    setSpinning(false)
    setWinnerIdx(winnerIndexRef.current)
    const winner = winnerRef.current
    winnerRef.current = null
    // Reveal the gold winner wedge under the caret before handing it off (which
    // removes the player from the pool and re-renders the wheel without them).
    revealTimerRef.current = setTimeout(() => {
      revealTimerRef.current = null
      if (winner != null) onSpinComplete(winner)
    }, REVEAL_MS)
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
                ref={rotorRef}
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
                    key={`${i}-${name}`}
                    data-testid="wheel-wedge"
                    d={wedgePath(i, count, RADIUS)}
                    fill={wedgeFill(i, winnerIdx)}
                    stroke="var(--color-border)"
                    strokeWidth={0.5}
                  />
                ))}
                {order.map((name, i) => {
                  const angle = wedgeMidAngle(i, count)
                  const flip = angle > 90 && angle < 270
                  const rot = flip ? angle + 90 : angle - 90
                  const p = polar(angle, RADIUS * 0.9)
                  const label = name.length > 12 ? `${name.slice(0, 11)}...` : name
                  return (
                    <text
                      key={`label-${i}-${name}`}
                      data-testid="wheel-label"
                      x={p.x}
                      y={p.y}
                      fill="var(--color-bright, var(--color-bg))"
                      fontSize={count > 16 ? 3.4 : count > 8 ? 4.4 : 6}
                      textAnchor={flip ? 'start' : 'end'}
                      dominantBaseline="middle"
                      transform={`rotate(${rot} ${p.x} ${p.y})`}
                    >
                      {label}
                    </text>
                  )
                })}
              </g>
              {/* Fixed pointer at top, outside the rotating group. */}
              <polygon
                className="pick-wheel__pointer"
                points="100,24 91,4 109,4"
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
