import { useEffect, useMemo, useRef, useState } from 'react'
import type { Draft as DraftState, DraftPick, Player, PickQueueEntry, Signups, Tourney } from '../../shared/types'
import { DEFAULT_TOURNEY } from '../../shared/types'
import { generatePickQueue } from '../utils/pickOrder'

interface UseDraftReturn {
  draft: DraftState
  effectiveTeams: { name: string; players: string[] }[]
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
  onAutoFill: () => void
  onSave: () => void
  resetDraft: () => void
}

export function buildPicks(pickOrder: string[], queue: PickQueueEntry[]): DraftPick[] {
  return pickOrder.map((playerName, i) => ({
    teamName: queue[i]?.teamName ?? '',
    playerName,
    pickNumber: i + 1,
  }))
}

export function computePick(
  draft: DraftState,
  effectiveTeams: { name: string; players: string[] }[],
  pickQueue: PickQueueEntry[],
  currentPickIndex: number,
  playerName: string,
): { newDraft: DraftState; picks: DraftPick[] } {
  const entry = pickQueue[currentPickIndex]
  const base = draft.teams.length > 0 ? draft.teams : effectiveTeams
  const newPickOrder = [...draft.pickOrder, playerName]
  const newTeams = entry
    ? base.map(t => t.name === entry.teamName ? { ...t, players: [...t.players, playerName] } : t)
    : base
  return {
    newDraft: { ...draft, pickOrder: newPickOrder, teams: newTeams },
    picks: buildPicks(newPickOrder, pickQueue),
  }
}

export function computeAutoFill(
  draft: DraftState,
  effectiveTeams: { name: string; players: string[] }[],
  pickQueue: PickQueueEntry[],
  currentPickIndex: number,
  shuffledPool: Player[],
): { newDraft: DraftState; picks: DraftPick[]; newPickIndex: number } {
  const remaining = pickQueue.slice(currentPickIndex)
  const pairs = remaining
    .map((entry, offset) => ({ entry, player: shuffledPool[offset] }))
    .filter(p => p.player !== undefined)
  const base = draft.teams.length > 0 ? draft.teams : effectiveTeams
  const newPickOrder = [...draft.pickOrder, ...pairs.map(p => p.player.name)]
  const newTeams = base.map(t => {
    const additions = pairs
      .filter(p => p.entry.teamName === t.name)
      .map(p => p.player.name)
    return additions.length > 0 ? { ...t, players: [...t.players, ...additions] } : t
  })
  return {
    newDraft: { ...draft, pickOrder: newPickOrder, teams: newTeams },
    picks: buildPicks(newPickOrder, pickQueue),
    newPickIndex: currentPickIndex + pairs.length,
  }
}

export function useDraft(): UseDraftReturn {
  const [draft, setDraft] = useState<DraftState>({ teams: [], pickOrder: [] })
  const [signups, setSignups] = useState<Signups>([])
  const [tourney, setTourney] = useState<Tourney | null>(null)
  const [timerDuration, setTimerDuration] = useState(60)
  const [remainingSeconds, setRemainingSeconds] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [currentPickIndex, setCurrentPickIndex] = useState(0)

  const draftRef = useRef(draft)
  draftRef.current = draft

  const timerDurationRef = useRef(timerDuration)
  timerDurationRef.current = timerDuration

  const currentPickIndexRef = useRef(currentPickIndex)
  currentPickIndexRef.current = currentPickIndex

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
      setTourney({ ...DEFAULT_TOURNEY, ...t })
    })
  }, [])

  const effectiveTeams = useMemo(() => {
    if (draft.teams.length > 0) return draft.teams
    const names = tourney?.teamNames ?? []
    return names.map(name => ({ name, players: [] }))
  }, [draft.teams, tourney?.teamNames])

  const effectiveTeamsRef = useRef(effectiveTeams)
  effectiveTeamsRef.current = effectiveTeams

  const pickQueue = useMemo(() => {
    if (!tourney || !effectiveTeams.length) return []
    const style = tourney.draftStyle === 'random' ? 'snake' : tourney.draftStyle as 'snake' | 'linear'
    const rounds = tourney.teamSize ?? 4
    return generatePickQueue(effectiveTeams.map(t => t.name), style, rounds)
  }, [tourney, effectiveTeams])

  const pickQueueRef = useRef(pickQueue)
  pickQueueRef.current = pickQueue

  const remainingSecondsRef = useRef(remainingSeconds)
  remainingSecondsRef.current = remainingSeconds

  useEffect(() => {
    window.api.saveDraftSession({
      timerDuration,
      remainingSeconds: remainingSecondsRef.current,
      currentPickIndex,
      pickQueue,
    })
  }, [timerDuration, currentPickIndex, pickQueue])

  function advancePick(): void {
    setCurrentPickIndex(i => i + 1)
    setRemainingSeconds(timerDurationRef.current)
    setTimerRunning(true)
  }

  function onPick(playerName: string): void {
    const { newDraft, picks } = computePick(
      draftRef.current,
      effectiveTeamsRef.current,
      pickQueueRef.current,
      currentPickIndexRef.current,
      playerName,
    )
    setDraft(newDraft)
    window.api.saveDraft(picks)
    if (pickQueueRef.current[currentPickIndexRef.current]) advancePick()
  }

  const unassigned = useMemo(() => {
    const pickedCounts = new Map<string, number>()
    for (const name of draft.pickOrder) {
      pickedCounts.set(name, (pickedCounts.get(name) ?? 0) + 1)
    }
    return signups.filter(p => {
      const remaining = pickedCounts.get(p.name) ?? 0
      if (remaining > 0) {
        pickedCounts.set(p.name, remaining - 1)
        return false
      }
      return true
    })
  }, [signups, draft.pickOrder])

  const unassignedRef = useRef(unassigned)
  unassignedRef.current = unassigned

  function onAutoFill(): void {
    const pool = [...unassignedRef.current]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const { newDraft, picks, newPickIndex } = computeAutoFill(
      draftRef.current,
      effectiveTeamsRef.current,
      pickQueueRef.current,
      currentPickIndexRef.current,
      pool,
    )
    setDraft(newDraft)
    window.api.saveDraft(picks)
    setCurrentPickIndex(newPickIndex)
    setTimerRunning(false)
  }

  function onSave(): void {
    window.api.saveDraft(buildPicks(draftRef.current.pickOrder, pickQueueRef.current))
  }

  function resetDraft(): void {
    const emptyDraft: DraftState = { teams: [], pickOrder: [] }
    setDraft(emptyDraft)
    setCurrentPickIndex(0)
    setRemainingSeconds(timerDurationRef.current)
    setTimerRunning(false)
    window.api.saveDraft([])
    window.api.saveDraftSession({
      timerDuration: timerDurationRef.current,
      remainingSeconds: timerDurationRef.current,
      currentPickIndex: 0,
      pickQueue: pickQueueRef.current,
    })
  }

  return {
    draft,
    effectiveTeams,
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
    onAutoFill,
    onSave,
    resetDraft,
  }
}
