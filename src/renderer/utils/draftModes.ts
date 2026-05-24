import type { DraftPick, Team } from '../../shared/types'

export function computeTeamCount(playerCount: number, teamSize: number): number {
  return Math.max(1, Math.floor(playerCount / teamSize))
}

export function autoNameTeams(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Team ${i + 1}`)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function randomAssign(players: string[], teams: string[]): DraftPick[] {
  const shuffled = shuffle(players)
  return shuffled.map((playerName, i) => ({
    playerName,
    teamName: teams[i % teams.length],
    pickNumber: i + 1,
  }))
}

export function snakeAssign(players: string[], teams: string[]): DraftPick[] {
  if (!teams.length) return []
  // Single-team short-circuit: every player goes to the only team
  if (teams.length === 1) {
    return players.map((playerName, i) => ({
      playerName,
      teamName: teams[0],
      pickNumber: i + 1,
    }))
  }
  const picks: DraftPick[] = []
  let forward = true
  let teamIdx = 0
  for (let i = 0; i < players.length; i++) {
    picks.push({ playerName: players[i], teamName: teams[teamIdx], pickNumber: i + 1 })
    if (forward) {
      if (teamIdx === teams.length - 1) { forward = false; teamIdx-- }
      else teamIdx++
    } else {
      if (teamIdx === 0) { forward = true; teamIdx++ }
      else teamIdx--
    }
  }
  return picks
}

export function applyPicks(picks: DraftPick[]): Team[] {
  const map = new Map<string, string[]>()
  for (const p of picks) {
    if (!map.has(p.teamName)) map.set(p.teamName, [])
    map.get(p.teamName)!.push(p.playerName)
  }
  return Array.from(map.entries()).map(([name, players]) => ({ name, players }))
}

export function unassignedPlayers(all: string[], picks: DraftPick[]): string[] {
  const assigned = new Set(picks.map(p => p.playerName))
  return all.filter(p => !assigned.has(p))
}
