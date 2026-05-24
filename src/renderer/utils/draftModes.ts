import type { DraftPick, Team } from '../../shared/types'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Fisher-Yates in-place shuffle returning a new array. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------------------------------------------------------------------------
// Exported utilities
// ---------------------------------------------------------------------------

/**
 * Calculate how many teams to create.
 * floor(playerCount / teamSize), minimum 1.
 */
export function computeTeamCount(playerCount: number, teamSize: number): number {
  if (!Number.isFinite(playerCount) || !Number.isFinite(teamSize)) return 1
  if (playerCount <= 0 || teamSize <= 0) return 1
  return Math.max(1, Math.floor(playerCount / teamSize))
}

/**
 * Generate default team names: ["Team 1", "Team 2", ...]
 */
export function autoNameTeams(count: number): string[] {
  const safeCount = Math.max(0, Math.floor(count))
  return Array.from({ length: safeCount }, (_, i) => `Team ${i + 1}`)
}

/**
 * Randomly assign players to teams (round-robin after Fisher-Yates shuffle).
 * Returns DraftPick[] in assignment order (1-based pickNumber).
 */
export function randomAssign(players: string[], teams: string[]): DraftPick[] {
  if (players.length === 0 || teams.length === 0) return []

  const shuffled = shuffle(players)
  return shuffled.map((playerName, i) => ({
    playerName,
    teamName: teams[i % teams.length],
    pickNumber: i + 1,
  }))
}

/**
 * Assign players to teams in snake order.
 * With 3 teams: Team1, Team2, Team3, Team3, Team2, Team1, Team1, Team2, ...
 * Returns DraftPick[] in snake order (1-based pickNumber).
 */
export function snakeAssign(players: string[], teams: string[]): DraftPick[] {
  if (players.length === 0 || teams.length === 0) return []

  const teamCount = teams.length
  return players.map((playerName, i) => {
    const round = Math.floor(i / teamCount)
    const posInRound = i % teamCount
    const teamIndex =
      round % 2 === 0
        ? posInRound                    // forward pass
        : teamCount - 1 - posInRound    // reverse pass
    return {
      playerName,
      teamName: teams[teamIndex],
      pickNumber: i + 1,
    }
  })
}

/**
 * Convert DraftPick[] into Team[] (group by teamName, ordered by pickNumber).
 * Picks are sorted by pickNumber before grouping so players within each team
 * appear in draft order regardless of the input array ordering.
 */
export function applyPicks(picks: DraftPick[]): Team[] {
  if (picks.length === 0) return []

  const sorted = [...picks].sort((a, b) => a.pickNumber - b.pickNumber)
  const order: string[] = []
  const map = new Map<string, string[]>()

  for (const pick of sorted) {
    if (!map.has(pick.teamName)) {
      map.set(pick.teamName, [])
      order.push(pick.teamName)
    }
    map.get(pick.teamName)!.push(pick.playerName)
  }

  return order.map(name => ({ name, players: map.get(name)! }))
}

/**
 * Get list of player names not yet in any pick.
 * Uses a name-count map so duplicate player names are handled correctly:
 * each occurrence in allPlayers is matched independently against each pick.
 */
export function unassignedPlayers(allPlayers: string[], picks: DraftPick[]): string[] {
  // Build a multiset of assigned names.
  const assignedCounts = new Map<string, number>()
  for (const pick of picks) {
    assignedCounts.set(pick.playerName, (assignedCounts.get(pick.playerName) ?? 0) + 1)
  }

  // Walk allPlayers and consume one count per matched name.
  const remaining = new Map<string, number>(assignedCounts)
  return allPlayers.filter(name => {
    const count = remaining.get(name) ?? 0
    if (count > 0) {
      remaining.set(name, count - 1)
      return false
    }
    return true
  })
}
