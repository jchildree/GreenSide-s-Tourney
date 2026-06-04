import { useEffect, useState } from 'react'
import type { Draft as DraftState, Signups } from '../../shared/types'
import { Timer } from '../components/Timer'
import { PickWheel } from '../components/PickWheel'
import { TeamRoster } from '../components/TeamRoster'

export function Draft(): JSX.Element {
  const [draft, setDraft] = useState<DraftState>({ teams: [], pickOrder: [] })
  const [signups, setSignups] = useState<Signups>([])
  const [timerDuration, setTimerDuration] = useState(60)
  const [remainingSeconds, setRemainingSeconds] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    Promise.all([
      window.api.getDraft(),
      window.api.getSignups(),
    ]).then(([d, s]) => {
      setDraft(d)
      setSignups(s)
    })
    window.api.getDraftSession().then(session => {
      setTimerDuration(session.timerDuration)
      setRemainingSeconds(session.remainingSeconds)
    })
  }, [])

  useEffect(() => {
    window.api.saveDraftSession({
      timerDuration,
      remainingSeconds,
      currentPickIndex: 0,
      pickQueue: [],
    })
  }, [timerDuration, remainingSeconds])

  function advancePick(): void {
    setRemainingSeconds(timerDuration)
    setTimerRunning(true)
  }

  const unassigned = signups.filter(p => !draft.pickOrder.includes(p.name))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(200, 169, 110, 0.3)',
        paddingBottom: '0.5rem',
      }}>
        <h2 style={{
          color: 'var(--color-gold)',
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

      {/* Wheel + Roster */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div>
          <PickWheel
            players={unassigned.map(p => p.name)}
            onPick={name => {
              setDraft(d => ({ ...d, pickOrder: [...d.pickOrder, name] }))
              advancePick()
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
