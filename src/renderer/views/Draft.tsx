import { useState } from 'react'
import { Timer } from '../components/Timer'
import { PickWheel } from '../components/PickWheel'
import { TeamRoster } from '../components/TeamRoster'
import { PickQueue } from '../components/PickQueue'
import { useDraft } from '../hooks/useDraft'

export function Draft(): JSX.Element {
  const {
    effectiveTeams,
    timerDuration,
    remainingSeconds,
    timerRunning,
    currentPickIndex,
    pickQueue,
    unassigned,
    tourney,
    setTimerDuration,
    setRemainingSeconds,
    setTimerRunning,
    onPick,
    onAutoFill,
    onSave,
    resetDraft,
  } = useDraft()

  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players')
  const currentPick = pickQueue[currentPickIndex]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(34, 197, 94, 0.3)',
        paddingBottom: '0.5rem',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tourney?.draftStyle === 'random' && unassigned.length > 0 && currentPickIndex < pickQueue.length && (
              <button className="btn-ghost" onClick={onAutoFill}>Auto-Fill All</button>
            )}
            <button className="btn-ghost" onClick={onSave}>Save</button>
            <button className="btn-ghost" onClick={resetDraft}>Reset</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
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
          {currentPick && (
            <div style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '4px',
              fontSize: '0.8rem',
              textAlign: 'right',
            }}>
              <span style={{ color: 'var(--color-muted)' }}>Now picking: </span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{currentPick.teamName}</span>
              <span style={{ color: 'var(--color-muted)', marginLeft: '0.5rem' }}>Round {currentPick.round}</span>
            </div>
          )}
          <PickWheel
            players={unassigned.map(p => p.name)}
            onPick={onPick}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '2px', marginBottom: '0.375rem' }}>
            {(['players', 'teams'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: activeTab === tab ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '3px',
                  color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-muted)',
                  cursor: 'pointer',
                }}
              >
                {tab === 'players' ? `Players (${unassigned.length})` : 'Teams'}
              </button>
            ))}
          </div>

          {activeTab === 'players' ? (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '4px',
              padding: '4px',
            }}>
              {unassigned.length === 0 ? (
                <p style={{
                  color: 'rgba(34, 197, 94, 0.35)',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  padding: '1rem 0.5rem',
                  fontStyle: 'italic',
                }}>
                  {effectiveTeams.length === 0 ? 'Configure teams in Setup' : 'All players drafted'}
                </p>
              ) : (
                unassigned.map((p, i) => (
                  <div key={p.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '5px 8px',
                    borderRadius: '3px',
                    background: i === 0 ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                  }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      color: 'rgba(34, 197, 94, 0.4)',
                      minWidth: '1.25rem',
                      textAlign: 'right',
                    }}>
                      {i + 1}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-silver)' }}>{p.name}</p>
                      {p.discordHandle && (
                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-muted)' }}>{p.discordHandle}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <PickQueue queue={pickQueue} currentIndex={currentPickIndex} />
          )}
        </div>

        <TeamRoster teams={effectiveTeams} />
      </div>
    </div>
  )
}
