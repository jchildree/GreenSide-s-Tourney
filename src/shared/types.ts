export type DraftStyle = 'random' | 'snake' | 'manual'
export type CredentialService = 'google' | 'challonge' | 'challonge-refresh'

export interface Tourney {
  name: string
  game: string
  dateTime: string        // ISO 8601
  signupDeadline: string  // ISO 8601
  draftStyle: DraftStyle
  minPlayers: number
  maxPlayers: number
  teamSize: number
  enabledFields: Partial<Record<'name' | 'game' | 'dateTime' | 'signupDeadline' | 'draftStyle' | 'minPlayers' | 'maxPlayers' | 'teamSize', boolean>>
}

export interface Player {
  name: string
  discordHandle: string
  submittedAt: string     // ISO 8601
}

export type Signups = Player[]

export interface Team {
  name: string
  players: string[]       // player names
}

export interface DraftPick {
  teamName: string
  playerName: string
  pickNumber: number
}

export interface Draft {
  teams: Team[]
  pickOrder: string[]     // player names in pick order
}

export interface Sync {
  challongeLastPushed: string | null
  challongeTournamentId: string | null
  googleFormId: string | null
  googleFormLastUpdated: string | null
}

export const DEFAULT_TOURNEY: Tourney = {
  name: '',
  game: '',
  dateTime: '',
  signupDeadline: '',
  draftStyle: 'random',
  minPlayers: 2,
  maxPlayers: 32,
  teamSize: 4,
  enabledFields: {},
}

export const DEFAULT_DRAFT: Draft = {
  teams: [],
  pickOrder: []
}

export const DEFAULT_SYNC: Sync = {
  challongeLastPushed: null,
  challongeTournamentId: null,
  googleFormId: null,
  googleFormLastUpdated: null
}

export interface AppConfig {
  challongeCommunityUrl: string
}

export interface OnboardingStatus {
  googleConnected: boolean
  challongeConnected: boolean
  complete: boolean
}

export const DEFAULT_CONFIG: AppConfig = {
  challongeCommunityUrl: ''
}

export const DEFAULT_ONBOARDING_STATUS: OnboardingStatus = {
  googleConnected: false,
  challongeConnected: false,
  complete: false,
}
