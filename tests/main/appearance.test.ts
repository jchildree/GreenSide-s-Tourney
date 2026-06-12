import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'

vi.mock('fs')
vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/fake/userData') },
  dialog: { showOpenDialog: vi.fn() },
}))

const { backgroundDataUrl, removeBackground, chooseBackground } = await import('../../src/main/appearance')
const { dialog } = await import('electron')

beforeEach(() => vi.clearAllMocks())

describe('backgroundDataUrl', () => {
  it('returns null when no file name stored', () => {
    expect(backgroundDataUrl(null)).toBeNull()
  })

  it('returns null when stored file is missing on disk', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    expect(backgroundDataUrl('bg.png')).toBeNull()
  })

  it('returns a data URL with the right mime type', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('fakepng'))
    const url = backgroundDataUrl('bg.png')
    expect(url).toMatch(/^data:image\/png;base64,/)
  })
})

describe('chooseBackground', () => {
  it('returns null when dialog is canceled', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({ canceled: true, filePaths: [] } as never)
    expect(await chooseBackground()).toBeNull()
  })

  it('copies the picked file into userData/backgrounds and returns its name', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({ canceled: false, filePaths: ['C:/pics/wall.jpg'] } as never)
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readdirSync).mockReturnValue([])
    const copy = vi.mocked(fs.copyFileSync).mockImplementation(() => {})
    const name = await chooseBackground()
    expect(name).toBe('background.jpg')
    expect(copy).toHaveBeenCalledWith('C:/pics/wall.jpg', expect.stringContaining('background.jpg'))
  })
})

describe('removeBackground', () => {
  it('deletes every file in the backgrounds dir', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readdirSync).mockReturnValue(['background.jpg'] as never)
    const rm = vi.mocked(fs.rmSync).mockImplementation(() => {})
    removeBackground()
    expect(rm).toHaveBeenCalledWith(expect.stringContaining('background.jpg'))
  })
})
