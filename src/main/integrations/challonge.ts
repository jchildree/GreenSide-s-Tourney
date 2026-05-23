import type { Draft } from '../../shared/types'

interface PushParams {
  apiKey: string
  tournamentId: string | null
  draft: Draft
}

export async function pushToChallonge(_params: PushParams): Promise<void> {
  throw new Error('not implemented')
}
