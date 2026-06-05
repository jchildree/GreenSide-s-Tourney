import { describe, it, expect } from 'vitest'
import {
  computeTeamCount,
  autoNameTeams,
  randomAssign,
  snakeAssign,
  applyPicks,
  unassignedPlayers,
} from '../../src/renderer/utils/draftModes'

// ---------------------------------------------------------------------------
// computeTeamCount
// ---------------------------------------------------------------------------
describe('computeTeamCount', () => {
  it('divides players by team size and floors the result', () => {
    expect(computeTeamCount(10, 3)).toBe(3)
  })

  it('returns 1 when playerCount is 0 (minimum guard)', () => {
    expect(computeTeamCount(0, 4)).toBe(1)
  })

  it('returns 1 when teamSize is 0 (minimum guard)', () => {
    expect(computeTeamCount(8, 0)).toBe(1)
  })

  it('returns 1 when playerCount is NaN (NaN guard)', () => {
    expect(computeTeamCount(NaN, 4)).toBe(1)
  })

  it('returns 1 when teamSize is Infinity (non-finite guard)', () => {
    expect(computeTeamCount(8, Infinity)).toBe(1)
  })

  it('returns exact count when evenly divisible', () => {
    expect(computeTeamCount(12, 4)).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// autoNameTeams
// ---------------------------------------------------------------------------
describe('autoNameTeams', () => {
  it('generates sequential names starting at 1', () => {
    expect(autoNameTeams(3)).toEqual(['Team 1', 'Team 2', 'Team 3'])
  })

  it('returns empty array for count 0', () => {
    expect(autoNameTeams(0)).toEqual([])
  })

  it('generates a single team name for count 1', () => {
    expect(autoNameTeams(1)).toEqual(['Team 1'])
  })
})

// ---------------------------------------------------------------------------
// randomAssign
// ---------------------------------------------------------------------------
describe('randomAssign', () => {
  const players = ['Alice', 'Bob', 'Charlie', 'Dave']
  const teams = ['Red', 'Blue']

  it('returns empty array when players list is empty', () => {
    expect(randomAssign([], teams)).toEqual([])
  })

  it('returns empty array when teams list is empty', () => {
    expect(randomAssign(players, [])).toEqual([])
  })

  it('produces one pick per player', () => {
    const picks = randomAssign(players, teams)
    expect(picks).toHaveLength(players.length)
  })

  it('assigns each player exactly once', () => {
    const picks = randomAssign(players, teams)
    const names = picks.map(p => p.playerName).sort()
    expect(names).toEqual([...players].sort())
  })

  it('uses 1-based pickNumber', () => {
    const picks = randomAssign(players, teams)
    expect(picks[0].pickNumber).toBe(1)
    expect(picks[picks.length - 1].pickNumber).toBe(players.length)
  })

  it('assigns teams round-robin over the shuffled list', () => {
    // Every pick must have a teamName that exists in the teams array.
    const picks = randomAssign(players, teams)
    picks.forEach(p => expect(teams).toContain(p.teamName))
  })

  it('distributes players roughly evenly across teams', () => {
    const bigPlayers = Array.from({ length: 10 }, (_, i) => `P${i}`)
    const picks = randomAssign(bigPlayers, teams)
    const redCount = picks.filter(p => p.teamName === 'Red').length
    const blueCount = picks.filter(p => p.teamName === 'Blue').length
    expect(redCount).toBe(5)
    expect(blueCount).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// snakeAssign
// ---------------------------------------------------------------------------
describe('snakeAssign', () => {
  const teams = ['T1', 'T2', 'T3']

  it('returns empty array when players list is empty', () => {
    expect(snakeAssign([], teams)).toEqual([])
  })

  it('returns empty array when teams list is empty', () => {
    expect(snakeAssign(['Alice'], [])).toEqual([])
  })

  it('uses 1-based pickNumber', () => {
    const players = ['A', 'B', 'C']
    const picks = snakeAssign(players, teams)
    expect(picks[0].pickNumber).toBe(1)
    expect(picks[picks.length - 1].pickNumber).toBe(players.length)
  })

  it('follows forward-reverse snake pattern for 3 teams across 6 picks', () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
    const picks = snakeAssign(players, teams)
    // Forward round: T1, T2, T3
    expect(picks[0].teamName).toBe('T1')
    expect(picks[1].teamName).toBe('T2')
    expect(picks[2].teamName).toBe('T3')
    // Reverse round: T3, T2, T1
    expect(picks[3].teamName).toBe('T3')
    expect(picks[4].teamName).toBe('T2')
    expect(picks[5].teamName).toBe('T1')
  })

  it('resumes forward direction on the third round', () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']
    const picks = snakeAssign(players, teams)
    expect(picks[6].teamName).toBe('T1')
    expect(picks[7].teamName).toBe('T2')
    expect(picks[8].teamName).toBe('T3')
  })

  it('assigns each player exactly once', () => {
    const players = ['A', 'B', 'C', 'D', 'E', 'F']
    const picks = snakeAssign(players, teams)
    const names = picks.map(p => p.playerName).sort()
    expect(names).toEqual([...players].sort())
  })
})

// ---------------------------------------------------------------------------
// applyPicks
// ---------------------------------------------------------------------------
describe('applyPicks', () => {
  it('returns empty array for no picks', () => {
    expect(applyPicks([])).toEqual([])
  })

  it('groups players by team and preserves pick order within each team', () => {
    const picks = [
      { teamName: 'Red', playerName: 'Alice', pickNumber: 1 },
      { teamName: 'Blue', playerName: 'Bob', pickNumber: 2 },
      { teamName: 'Red', playerName: 'Charlie', pickNumber: 3 },
      { teamName: 'Blue', playerName: 'Dave', pickNumber: 4 },
    ]
    const teams = applyPicks(picks)
    expect(teams).toHaveLength(2)
    const red = teams.find(t => t.name === 'Red')!
    const blue = teams.find(t => t.name === 'Blue')!
    expect(red.players).toEqual(['Alice', 'Charlie'])
    expect(blue.players).toEqual(['Bob', 'Dave'])
  })

  it('sorts by pickNumber so out-of-order input still produces correct player ordering', () => {
    const picks = [
      { teamName: 'Red', playerName: 'Charlie', pickNumber: 3 },
      { teamName: 'Blue', playerName: 'Bob', pickNumber: 2 },
      { teamName: 'Red', playerName: 'Alice', pickNumber: 1 },
    ]
    const teams = applyPicks(picks)
    const red = teams.find(t => t.name === 'Red')!
    expect(red.players).toEqual(['Alice', 'Charlie'])
  })

  it('preserves first-seen team order', () => {
    const picks = [
      { teamName: 'Green', playerName: 'X', pickNumber: 1 },
      { teamName: 'Yellow', playerName: 'Y', pickNumber: 2 },
    ]
    const teams = applyPicks(picks)
    expect(teams[0].name).toBe('Green')
    expect(teams[1].name).toBe('Yellow')
  })

  it('handles a single pick correctly', () => {
    const picks = [{ teamName: 'Solo', playerName: 'OnlyPlayer', pickNumber: 1 }]
    const teams = applyPicks(picks)
    expect(teams).toEqual([{ name: 'Solo', players: ['OnlyPlayer'] }])
  })
})

// ---------------------------------------------------------------------------
// unassignedPlayers
// ---------------------------------------------------------------------------
describe('unassignedPlayers', () => {
  const all = ['Alice', 'Bob', 'Charlie', 'Dave']

  it('returns all players when picks is empty', () => {
    expect(unassignedPlayers(all, [])).toEqual(all)
  })

  it('returns empty array when all players are assigned', () => {
    const picks = all.map((name, i) => ({ playerName: name, teamName: 'T', pickNumber: i + 1 }))
    expect(unassignedPlayers(all, picks)).toEqual([])
  })

  it('excludes only assigned players and preserves order', () => {
    const picks = [
      { playerName: 'Bob', teamName: 'T', pickNumber: 1 },
      { playerName: 'Dave', teamName: 'T', pickNumber: 2 },
    ]
    expect(unassignedPlayers(all, picks)).toEqual(['Alice', 'Charlie'])
  })

  it('returns empty array when allPlayers is empty', () => {
    const picks = [{ playerName: 'Alice', teamName: 'T', pickNumber: 1 }]
    expect(unassignedPlayers([], picks)).toEqual([])
  })

  it('handles duplicate player names correctly: only assigned occurrences are removed', () => {
    // Two players named 'Alice', only one assigned
    const picks = [{ playerName: 'Alice', teamName: 'T', pickNumber: 1 }]
    expect(unassignedPlayers(['Alice', 'Alice', 'Bob'], picks)).toEqual(['Alice', 'Bob'])
  })
})
