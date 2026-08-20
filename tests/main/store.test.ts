import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'

vi.mock('fs')
vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/fake/userData') }
}))

// Import after mocks
const { readTourney, saveTourney, readSignups, saveSignups, readDraft, saveDraft, readSync, saveSync, clearTournamentData, readConfig, readBalances, saveBalances, readPot, savePot } =
  await import('../../src/main/store')

const DEFAULT = {
  tourney: { name: '', game: '', dateTime: '', signupDeadline: '', draftStyle: 'random', eliminationType: 'single', maps: [], rules: '', minPlayers: 2, maxPlayers: 32, teamNames: [], teamSize: 4, streamLink: '', enabledFields: {} },
  draft: { teams: [], pickOrder: [] },
  sync: { challongeLastPushed: null, challongeTournamentId: null, googleFormLastUpdated: null }
}

beforeEach(() => vi.clearAllMocks())

describe('readTourney', () => {
  it('returns default when file missing', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(DEFAULT.tourney))
    expect(readTourney()).toEqual(DEFAULT.tourney)
  })

  it('returns parsed tourney when file exists', () => {
    const saved = { ...DEFAULT.tourney, name: 'Spring Cup' }
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(saved))
    expect(readTourney().name).toBe('Spring Cup')
  })
})

describe('saveTourney', () => {
  it('writes tourney to data/tourney.json', () => {
    const tourney = { ...DEFAULT.tourney, name: 'Fall Cup' }
    const write = vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    saveTourney(tourney)
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('tourney.json'),
      JSON.stringify(tourney, null, 2),
      'utf-8'
    )
  })
})

describe('readSignups', () => {
  it('returns empty array when file missing', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    vi.mocked(fs.readFileSync).mockReturnValue('[]')
    expect(readSignups()).toEqual([])
  })
})

describe('clearTournamentData', () => {
  it('removes the five tournament files and leaves config.json alone', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    const rm = vi.mocked(fs.rmSync).mockImplementation(() => {})
    clearTournamentData()
    const removed = rm.mock.calls.map(c => String(c[0]))
    for (const name of ['tourney.json', 'signups.json', 'draft.json', 'draft-session.json', 'sync.json']) {
      expect(removed.some(p => p.includes(name))).toBe(true)
    }
    expect(removed.some(p => p.includes('config.json'))).toBe(false)
  })

  it('skips files that do not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    const rm = vi.mocked(fs.rmSync).mockImplementation(() => {})
    clearTournamentData()
    expect(rm).not.toHaveBeenCalled()
  })
})

describe('saveDraft / readDraft round-trip', () => {
  it('writes draft and reads it back', () => {
    const draft = { teams: [{ name: 'Alpha', players: ['Alice'] }], pickOrder: ['Alice'] }
    let stored = ''
    vi.mocked(fs.writeFileSync).mockImplementation((_p, data) => { stored = data as string })
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockImplementation(() => stored)
    saveDraft(draft)
    expect(readDraft()).toEqual(draft)
  })
})

describe('balances round-trip', () => {
  it('returns empty array when file missing', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    vi.mocked(fs.readFileSync).mockReturnValue('[]')
    expect(readBalances()).toEqual([])
  })

  it('writes balances and reads them back', () => {
    const balances = [{ name: 'Alice', owed: 20, paid: 5 }]
    let stored = ''
    vi.mocked(fs.writeFileSync).mockImplementation((_p, data) => { stored = data as string })
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockImplementation(() => stored)
    saveBalances(balances)
    expect(readBalances()).toEqual(balances)
  })
})

describe('pot round-trip', () => {
  it('returns default total 0 when file missing', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ total: 0 }))
    expect(readPot()).toEqual({ total: 0 })
  })

  it('writes pot and reads it back', () => {
    let stored = ''
    vi.mocked(fs.writeFileSync).mockImplementation((_p, data) => { stored = data as string })
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockImplementation(() => stored)
    savePot({ total: 150 })
    expect(readPot()).toEqual({ total: 150 })
  })
})

describe('owed add/subtract math', () => {
  const adjust = (owed: number, delta: number): number => owed + delta
  it('adds and subtracts an enterable amount', () => {
    expect(adjust(10, 5)).toBe(15)
    expect(adjust(10, -3)).toBe(7)
    expect(adjust(0, -5)).toBe(-5)
  })
})

describe('readConfig', () => {
  it('merges defaults into old config files missing new fields', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ challongeCommunityUrl: 'https://challonge.com/x' }))
    const cfg = readConfig()
    expect(cfg.challongeCommunityUrl).toBe('https://challonge.com/x')
    expect(cfg.theme).toBe('green')
    expect(cfg.backgroundImage).toBeNull()
  })
})
