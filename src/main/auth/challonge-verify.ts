export async function verifyChallongeKey(apiKey: string): Promise<boolean> {
  if (!apiKey.trim()) return false
  try {
    const resp = await fetch(
      `https://api.challonge.com/v1/tournaments.json?api_key=${encodeURIComponent(apiKey)}`
    )
    return resp.ok
  } catch {
    return false
  }
}
