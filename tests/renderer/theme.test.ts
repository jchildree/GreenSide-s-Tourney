import { describe, it, expect } from 'vitest'
import { THEMES, applyTheme } from '../../src/renderer/theme'
import { THEME_IDS } from '../../src/shared/types'

describe('THEMES', () => {
  it('covers every ThemeId exactly once', () => {
    expect(THEMES.map(t => t.id).sort()).toEqual([...THEME_IDS].sort())
  })

  it('every theme has a label and swatch color', () => {
    for (const t of THEMES) {
      expect(t.label.length).toBeGreaterThan(0)
      expect(t.swatch).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('applyTheme', () => {
  it('sets data-theme attribute for non-default themes', () => {
    applyTheme('crimson')
    expect(document.documentElement.getAttribute('data-theme')).toBe('crimson')
  })

  it('removes the attribute for the default green theme', () => {
    applyTheme('crimson')
    applyTheme('green')
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })
})
