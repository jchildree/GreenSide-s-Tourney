import { useEffect, useMemo, useState } from 'react'
import type { Draft as DraftState, Player, PickQueueEntry, Signups, Tourney } from '../../shared/types'
import { generatePickQueue } from '../utils/pickOrder'

interface UseDraftReturn {
  draft: DraftState
  signups: Signups
  tourney: Tourney | null
  timerDuration: number
  remainingSeconds: number
  timerRunning: boolean
  currentPickIndex: number
  pickQueue: PickQueueEntry[]
  unassigned: Player[]
  setTimerDuration: (s: number) => void
  setRemainingSeconds: (s: number) => void
  setTimerRunning: React.Dispatch<React.SetStateAction<boolean>>
  onPick: (playerName: string) => void
}

export function useDraft(): UseDraftReturn {
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

  function onPick(playerName: string): void {
    const entry = pickQueue[currentPickIndex]
    setDraft(d => ({
      ...d,
      pickOrder: [...d.pickOrder, playerName],
      teams: entry
        ? d.teams.map(t =>
            t.name === entry.teamName
              ? { ...t, players: [...t.players, playerName] }
              : t
          )
        : d.teams,
    }))
    if (entry) advancePick()
  }

  const unassigned = signups.filter(p => !draft.pickOrder.includes(p.name))

  return {
    draft,
    signups,
    tourney,
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
  }
}
