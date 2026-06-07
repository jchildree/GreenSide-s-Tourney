import { describe, it, expect } from 'vitest'
import { buildPicks, computePick, computeAutoFill } from '../../../src/renderer/hooks/useDraft'
import type { Draft, PickQueueEntry, Player } from '../../../src/shared/types'

const teams = [
  { name: 'Alpha', players: [] as string[] },
  { name: 'Beta', players: [] as string[] },
]

const queue: PickQueueEntry[] = [
  { teamName: 'Alpha', round: 1, pickNumber: 1 },
  { teamName: 'Beta', round: 1, pickNumber: 2 },
]

const emptyDraft: Draft = { teams: [], pickOrder: [] }

describe('buildPicks', () => {
  it('maps pick order to DraftPick array with correct team and number', () => {
    const picks = buildPicks(['Alice', 'Bob'], queue)
    expect(picks).toEqual([
      { teamName: 'Alpha', playerName: 'Alice', pickNumber: 1 },
      { teamName: 'Beta', playerName: 'Bob', pickNumber: 2 },
    ])
  })

  it('returns empty array for empty pickOrder', () => {
    expect(buildPicks([], queue)).toEqual([])
  })
})

describe('computePick', () => {
  it('assigns player to team at currentPickIndex', () => {
    const { newDraft } = computePick(emptyDraft, teams, queue, 0, 'Alice')
    expect(newDraft.teams.find(t => t.name === 'Alpha')?.players).toEqual(['Alice'])
    expect(newDraft.pickOrder).toEqual(['Alice'])
  })

  it('uses effectiveTeams when draft.teams is empty', () => {
    const { newDraft } = computePick(emptyDraft, teams, queue, 0, 'Alice')
    expect(newDraft.teams).toHaveLength(2)
    expect(newDraft.teams[0].name).toBe('Alpha')
  })

  it('appends to existing players and pickOrder', () => {
    const draft: Draft = {
      teams: [{ name: 'Alpha', players: ['Alice'] }, { name: 'Beta', players: [] }],
      pickOrder: ['Alice'],
    }
    const { newDraft } = computePick(draft, teams, queue, 1, 'Bob')
    expect(newDraft.teams.find(t => t.name === 'Beta')?.players).toEqual(['Bob'])
    expect(newDraft.pickOrder).toEqual(['Alice', 'Bob'])
  })

  it('does not assign to any team when pickQueue entry is undefined', () => {
    const { newDraft } = computePick(emptyDraft, teams, queue, 99, 'Alice')
    expect(newDraft.pickOrder).toContain('Alice')
    expect(newDraft.teams.every(t => t.players.length === 0)).toBe(true)
  })

  it('returns picks array matching new pick order', () => {
    const { picks } = computePick(emptyDraft, teams, queue, 0, 'Alice')
    expect(picks).toEqual([{ teamName: 'Alpha', playerName: 'Alice', pickNumber: 1 }])
  })
})

describe('computeAutoFill', () => {
  const alice: Player = { name: 'Alice', discordHandle: '', submittedAt: '' }
  const bob: Player = { name: 'Bob', discordHandle: '', submittedAt: '' }

  it('assigns pool players to teams in queue order', () => {
    const { newDraft, newPickIndex } = computeAutoFill(emptyDraft, teams, queue, 0, [alice, bob])
    expect(newDraft.pickOrder).toEqual(['Alice', 'Bob'])
    expect(newPickIndex).toBe(2)
    expect(newDraft.teams.find(t => t.name === 'Alpha')?.players).toEqual(['Alice'])
    expect(newDraft.teams.find(t => t.name === 'Beta')?.players).toEqual(['Bob'])
  })

  it('handles fewer players than remaining picks', () => {
    const { newDraft, newPickIndex } = computeAutoFill(emptyDraft, teams, queue, 0, [alice])
    expect(newDraft.pickOrder).toEqual(['Alice'])
    expect(newPickIndex).toBe(1)
  })

  it('starts from currentPickIndex', () => {
    const draft: Draft = {
      teams: [{ name: 'Alpha', players: ['Alice'] }, { name: 'Beta', players: [] }],
      pickOrder: ['Alice'],
    }
    const { newDraft, newPickIndex } = computeAutoFill(draft, teams, queue, 1, [bob])
    expect(newDraft.pickOrder).toEqual(['Alice', 'Bob'])
    expect(newPickIndex).toBe(2)
    expect(newDraft.teams.find(t => t.name === 'Beta')?.players).toEqual(['Bob'])
  })

  it('uses effectiveTeams when draft.teams is empty', () => {
    const { newDraft } = computeAutoFill(emptyDraft, teams, queue, 0, [alice, bob])
    expect(newDraft.teams).toHaveLength(2)
  })
})
