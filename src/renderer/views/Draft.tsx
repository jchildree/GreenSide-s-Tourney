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
    <div>
      <h2>Draft Board</h2>
      <Timer initialSeconds={60} />
      <PickWheel players={unassigned.map(p => p.name)} onPick={name => {
        setDraft(d => ({ ...d, pickOrder: [...d.pickOrder, name] }))
      }} />
      <TeamRoster teams={draft.teams} />
    </div>
  )
}
