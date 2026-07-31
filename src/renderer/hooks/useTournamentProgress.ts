import { useCallback, useEffect, useState } from 'react'
import type { Draft, Signups, Sync, Tourney } from '../../shared/types'
import { DEFAULT_TOURNEY } from '../../shared/types'

export type StepId = 'setup' | 'signups' | 'draft' | 'publish' | 'live'

export interface Step {
  id: StepId
  label: string
  desc: string
  done: boolean
}

export interface Progress {
  steps: Step[]
  /** First step that is not done — where "Continue" should land. */
  next: Step
  tourney: Tourney
  signups: Signups
  draft: Draft | null
  sync: Sync | null
  loading: boolean
  reload: () => Promise<void>
}

function assignedCount(draft: Draft | null): number {
  if (!draft) return 0
  return draft.teams.reduce((n, t) => n + t.players.length, 0)
}

/**
 * Single source of truth for step completion. Every surface (sidebar badges,
 * Home cards, Continue button) reads from here so they can never disagree.
 */
export function useTournamentProgress(): Progress {
  const [tourney, setTourney] = useState<Tourney>(DEFAULT_TOURNEY)
  const [signups, setSignups] = useState<Signups>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [sync, setSync] = useState<Sync | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const [t, sg, d, sy] = await Promise.all([
      window.api.getTourney(),
      window.api.getSignups(),
      window.api.getDraft(),
      window.api.getSync(),
    ])
    setTourney(prev => ({ ...prev, ...t }))
    setSignups(sg)
    setDraft(d)
    setSync(sy)
    setLoading(false)
  }, [])

  useEffect(() => { void reload() }, [reload])

  const setupDone = Boolean(tourney.name && tourney.game && tourney.dateTime)
  const signupsDone = signups.length > 0
  const draftDone = signups.length > 0 && assignedCount(draft) >= signups.length
  const publishDone = Boolean(sync?.challongeTournamentId && sync?.tournamentStartedAt)

  const steps: Step[] = [
    { id: 'setup',   label: 'Setup',        desc: 'Name, game, dates, teams',       done: setupDone },
    { id: 'signups', label: 'Signups',     desc: 'Update the form, fetch players',  done: signupsDone },
    { id: 'draft',   label: 'Draft',        desc: 'Spin the wheel, build teams',    done: draftDone },
    { id: 'publish', label: 'Publish',      desc: 'Push to Challonge and start',    done: publishDone },
    { id: 'live',    label: 'Live matches', desc: 'Enter scores round by round',    done: false },
  ]

  return {
    steps,
    next: steps.find(s => !s.done) ?? steps[steps.length - 1],
    tourney,
    signups,
    draft,
    sync,
    loading,
    reload,
  }
}
