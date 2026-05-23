import { useEffect, useState } from 'react'
import type { Draft as DraftState, Signups } from '../../shared/types'
import { Timer } from '../components/Timer'
import { PickWheel } from '../components/PickWheel'
import { TeamRoster } from '../components/TeamRoster'

export function Draft(): JSX.Element {
  const [draft, setDraft] = useState<DraftState>({ teams: [], pickOrder: [] })
  const [signups, setSignups] = useState<Signups>([])

  useEffect(() => {
    Promise.all([window.api.getDraft(), window.api.getSignups()]).then(([d, s]) => {
      setDraft(d)
      setSignups(s)
    })
  }, [])

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
        <Timer initialSeconds={60} />
      </div>

      {/* Wheel + Roster */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div>
          <PickWheel
            players={unassigned.map(p => p.name)}
            onPick={name => setDraft(d => ({ ...d, pickOrder: [...d.pickOrder, name] }))}
          />
        </div>
        <div>
          <TeamRoster teams={draft.teams} />
        </div>
      </div>
    </div>
  )
}
