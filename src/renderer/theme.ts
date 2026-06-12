import type { ThemeId } from '../shared/types'

export interface ThemeMeta {
  id: ThemeId
  label: string
  swatch: string
}

export const THEMES: ThemeMeta[] = [
  { id: 'green',   label: 'Green',   swatch: '#1ebb57' },
  { id: 'blue',    label: 'Blue',    swatch: '#3b82f6' },
  { id: 'crimson', label: 'Crimson', swatch: '#ef4444' },
  { id: 'purple',  label: 'Purple',  swatch: '#a855f7' },
  { id: 'amber',   label: 'Amber',   swatch: '#f59e0b' },
]

export function applyTheme(theme: ThemeId): void {
  if (theme === 'green') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
}
