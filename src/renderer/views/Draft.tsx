import { useEffect, useMemo, useState } from 'react'
import type { Draft as DraftState, Signups, Tourney } from '../../shared/types'
import { DEFAULT_TOURNEY } from '../../shared/types'
import { Timer } from '../components/Timer'
import { PickWheel } from '../components/PickWheel'
import { TeamRoster } from '../components/TeamRoster'
import { PickQueue } from '../components/PickQueue'
import { generatePickQueue } from '../utils/pickOrder'

export function Draft(): JSX.Element {
  const [draft, setDraft] = useState<DraftState>({ teams: [], pickOrder: [] })
  const [signups, setSignups] = useState<Signups>([])
  const [tourney, setTourney] = useState<Tourney | null>(null)
  const [timerDuration, setTimerDuration] = useState(60)
  const [remainingSeconds, setRemainingSeconds] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [currentPickIndex, setCurrentPickIndex] = useState(0)

  useEffect(() => {
    Promise.all([
      window.api.getDraft(),
      window.api.getSignups(),
      window.api.getDraftSession(),
      window.api.getTourney(),
    ]).then(([d, s, session, t]) => {
      setDraft(d)
      setSignups(s)
      setTimerDuration(session.timerDuration)
      setRemainingSeconds(session.remainingSeconds)
      setCurrentPickIndex(session.currentPickIndex)
      setTourney(t)
    })
  }, [])

  const pickQueue = useMemo(() => {
    if (!tourney || !draft.teams.length) return []
    return generatePickQueue(
      draft.teams.map(t => t.name),
      (tourney.draftStyle === 'random' ? 'snake' : tourney.draftStyle) as 'snake' | 'linear',
      Math.ceil(signups.length / Math.max(draft.teams.length, 1))
    )
  }, [tourney, draft.teams, signups.length])

  useEffect(() => {
    window.api.saveDraftSession({
      timerDuration,
      remainingSeconds: timerDuration,
      currentPickIndex,
      pickQueue,
    })
  }, [timerDuration, currentPickIndex, pickQueue])

  function advancePick(): void {
    setCurrentPickIndex(i => i + 1)
    setRemainingSeconds(timerDuration)
    setTimerRunning(true)
  }

  const unassigned = signups.filter(p => !draft.pickOrder.includes(p.name))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(34, 197, 94, 0.3)',
        paddingBottom: '0.5rem',
      }}>
        <h2 style={{
          color: 'var(--color-primary)',
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          Draft Board
        </h2>
        <Timer
          durationSeconds={timerDuration}
          remainingSeconds={remainingSeconds}
          running={timerRunning}
          onDurationChange={s => {
            setTimerDuration(s)
            setRemainingSeconds(s)
            setTimerRunning(false)
          }}
          onToggle={() => setTimerRunning(r => !r)}
          onReset={() => {
            setRemainingSeconds(timerDuration)
            setTimerRunning(false)
          }}
          onTick={r => setRemainingSeconds(r)}
          onExpire={() => setTimerRunning(false)}
        />
      </div>

      <PickQueue queue={pickQueue} currentIndex={currentPickIndex} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div>
          <PickWheel
            players={unassigned.map(p => p.name)}
            onPick={name => {
              const entry = pickQueue[currentPickIndex]
              setDraft(d => ({
                ...d,
                pickOrder: [...d.pickOrder, name],
                teams: entry
                  ? d.teams.map(t =>
                      t.name === entry.teamName
                        ? { ...t, players: [...t.players, name] }
                        : t
                    )
                  : d.teams,
              }))
              if (entry) advancePick()
            }}
          />
        </div>
        <div>
          <TeamRoster teams={draft.teams} />
        </div>
      </div>
    </div>
  )
}
