import { Timer } from '../components/Timer'
import { PickWheel } from '../components/PickWheel'
import { TeamRoster } from '../components/TeamRoster'
import { PickQueue } from '../components/PickQueue'
import { useDraft } from '../hooks/useDraft'

export function Draft(): JSX.Element {
  const {
    draft,
    timerDuration,
    remainingSeconds,
    timerRunning,
    currentPickIndex,
    pickQueue,
    unassigned,
    setTimerDuration,
    setRemainingSeconds,
    setTimerRunning,
    onPick,
  } = useDraft()

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
            onPick={onPick}
          />
        </div>
        <div>
          <TeamRoster teams={draft.teams} />
        </div>
      </div>
    </div>
  )
}
