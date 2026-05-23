import * as fs from 'fs'
import * as path from 'path'
import { app, safeStorage } from 'electron'
import type { CredentialService } from '../shared/types'

function credDir(): string {
  return path.join(app.getPath('userData'), 'credentials')
}

function credPath(service: CredentialService): string {
  return path.join(credDir(), `${service}.enc`)
}

function ensureDir(): void {
  const dir = credDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function saveCredential(service: CredentialService, value: string): void {
  ensureDir()
  const encrypted = safeStorage.encryptString(value)
  fs.writeFileSync(credPath(service), encrypted)
}

export function getCredential(service: CredentialService): string | null {
  const p = credPath(service)
  if (!fs.existsSync(p)) return null
  const buf = fs.readFileSync(p) as Buffer
  return safeStorage.decryptString(buf)
}
