export type DraftStyle = 'random' | 'snake' | 'manual'
export type CredentialService = 'google' | 'challonge' | 'challonge-refresh'

export const CRED = {
  google: 'google',
  challonge: 'challonge',
  challongeRefresh: 'challonge-refresh',
} as const satisfies Record<string, CredentialService>

export interface Tourney {
  name: string
  game: string
  dateTime: string        // ISO 8601
  signupDeadline: string  // ISO 8601
  draftStyle: DraftStyle
  eliminationType: 'single' | 'double'
  maps: string[][]
  rules: string
  minPlayers: number
  maxPlayers: number
  teamNames: string[]     // team slot names for draft
  teamSize: number        // players per team, default 4
  streamLink: string
  enabledFields: Partial<Record<'name' | 'game' | 'dateTime' | 'signupDeadline' | 'draftStyle' | 'minPlayers' | 'maxPlayers' | 'teamSize', boolean>>
}

export interface Player {
  name: string
  discordHandle: string
  submittedAt: string     // ISO 8601
  seed?: number           // 0-based rank set by admin reorder; unset sorts last
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
  tournamentStartedAt: string | null
}

export const DEFAULT_TOURNEY: Tourney = {
  name: '',
  game: '',
  dateTime: '',
  signupDeadline: '',
  draftStyle: 'random',
  eliminationType: 'single',
  maps: [],
  rules: '',
  minPlayers: 2,
  maxPlayers: 32,
  teamNames: [],
  teamSize: 4,
  streamLink: '',
  enabledFields: {}
}

export const DEFAULT_DRAFT: Draft = {
  teams: [],
  pickOrder: []
}

export const DEFAULT_SYNC: Sync = {
  challongeLastPushed: null,
  challongeTournamentId: null,
  googleFormId: null,
  googleFormLastUpdated: null,
  tournamentStartedAt: null,
}

export type ThemeId = 'green' | 'blue' | 'crimson' | 'purple' | 'amber'

export const THEME_IDS: ThemeId[] = ['green', 'blue', 'crimson', 'purple', 'amber']

export interface AppConfig {
  challongeCommunityUrl: string
  theme: ThemeId
  backgroundImage: string | null
  /** 0-100. How strongly the background image shows through. */
  backgroundOpacity: number
}

export interface Appearance {
  theme: ThemeId
  backgroundDataUrl: string | null
  backgroundOpacity: number
}

export interface OnboardingStatus {
  googleConnected: boolean
  challongeConnected: boolean
  complete: boolean
}

export const DEFAULT_CONFIG: AppConfig = {
  challongeCommunityUrl: '',
  theme: 'green',
  backgroundImage: null,
  backgroundOpacity: 35,
}

export const DEFAULT_ONBOARDING_STATUS: OnboardingStatus = {
  googleConnected: false,
  challongeConnected: false,
  complete: false,
}

export interface PickQueueEntry {
  teamName: string
  round: number
  pickNumber: number
}

export interface DraftSession {
  timerDuration: number      // seconds, 10-3600
  remainingSeconds: number
  currentPickIndex: number
  pickQueue: PickQueueEntry[]
}

export const DEFAULT_DRAFT_SESSION: DraftSession = {
  timerDuration: 60,
  remainingSeconds: 60,
  currentPickIndex: 0,
  pickQueue: [],
}

export interface ChallongeMatch {
  id: string
  state: 'open' | 'complete' | 'pending'
  round: number
  player1Id: string | null
  player2Id: string | null
  winnerId: string | null
  scoresCsv: string | null
  suggestedPlayOrder: number | null
}

export interface ChallongeParticipant {
  id: string
  name: string
}

export interface PlayerBalance {
  name: string
  owed: number
  paid: number
}

export type Balances = PlayerBalance[]

export interface Pot {
  total: number
}

export const DEFAULT_POT: Pot = { total: 0 }

export const CHALLONGE_CREDENTIAL_EXPIRED = 'CHALLONGE_CREDENTIAL_EXPIRED'
export const GOOGLE_CREDENTIAL_EXPIRED = 'GOOGLE_CREDENTIAL_EXPIRED'
