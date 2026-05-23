import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import type { Tourney, Signups, Draft, Sync, AppConfig } from '../shared/types'
import { DEFAULT_TOURNEY, DEFAULT_DRAFT, DEFAULT_SYNC, DEFAULT_CONFIG } from '../shared/types'

function dataDir(): string {
  return path.join(app.getPath('userData'), 'data')
}

function filePath(name: string): string {
  return path.join(dataDir(), name)
}

function ensureDir(): void {
  const dir = dataDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readJson<T>(name: string, defaultValue: T): T {
  ensureDir()
  const p = filePath(name)
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify(defaultValue, null, 2), 'utf-8')
    return defaultValue
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8') as string) as T
}

function writeJson<T>(name: string, value: T): void {
  ensureDir()
  fs.writeFileSync(filePath(name), JSON.stringify(value, null, 2), 'utf-8')
}

export function readTourney(): Tourney { return readJson('tourney.json', DEFAULT_TOURNEY) }
export function saveTourney(t: Tourney): void { writeJson('tourney.json', t) }

export function readSignups(): Signups { return readJson('signups.json', []) }
export function saveSignups(s: Signups): void { writeJson('signups.json', s) }

export function readDraft(): Draft { return readJson('draft.json', DEFAULT_DRAFT) }
export function saveDraft(d: Draft): void { writeJson('draft.json', d) }

export function readSync(): Sync { return readJson('sync.json', DEFAULT_SYNC) }
export function saveSync(s: Sync): void { writeJson('sync.json', s) }

export function readConfig(): AppConfig { return readJson('config.json', DEFAULT_CONFIG) }
export function saveConfig(c: AppConfig): void { writeJson('config.json', c) }
