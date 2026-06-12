import * as fs from 'fs'
import * as path from 'path'
import { app, dialog } from 'electron'

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

function backgroundsDir(): string {
  return path.join(app.getPath('userData'), 'backgrounds')
}

export function backgroundDataUrl(fileName: string | null): string | null {
  if (!fileName) return null
  const p = path.join(backgroundsDir(), fileName)
  if (!fs.existsSync(p)) return null
  const mime = MIME[path.extname(fileName).toLowerCase()]
  if (!mime) return null
  return `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`
}

export function removeBackground(): void {
  const dir = backgroundsDir()
  if (!fs.existsSync(dir)) return
  for (const f of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, f))
  }
}

export async function chooseBackground(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    title: 'Choose background image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const src = result.filePaths[0]
  const ext = path.extname(src).toLowerCase()
  if (!MIME[ext]) return null
  const dir = backgroundsDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  removeBackground()
  const name = `background${ext}`
  fs.copyFileSync(src, path.join(dir, name))
  return name
}
