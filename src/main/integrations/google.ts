import type { Tourney, Signups } from '../../shared/types'

interface UpdateFormParams {
  oauthToken: string
  tourney: Tourney
}

interface FetchSignupsParams {
  oauthToken: string
  formId: string
}

export async function updateGoogleForm(_params: UpdateFormParams): Promise<void> {
  throw new Error('not implemented')
}

export async function fetchSignups(_params: FetchSignupsParams): Promise<Signups> {
  throw new Error('not implemented')
}
