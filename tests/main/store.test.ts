import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'

vi.mock('fs')
vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/fake/userData') }
}))

// Import after mocks
const { readTourney, saveTourney, readSignups, saveSignups, readDraft, saveDraft, readSync, saveSync } =
  await import('../../src/main/store')

const DEFAULT = {
  tourney: { name: '', game: '', dateTime: '', signupDeadline: '', draftStyle: 'random', minPlayers: 2, maxPlayers: 32 },
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
