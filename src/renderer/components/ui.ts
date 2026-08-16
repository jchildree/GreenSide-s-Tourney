import type { CSSProperties } from 'react'

/** Shared visual constants for the redesigned console. */

export const CARD: CSSProperties = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.85rem',
  padding: '1.375rem 1.5rem',
}

export const EYEBROW: CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-primary)',
}

export const VIEW_TITLE: CSSProperties = {
  margin: '0 0 0.25rem',
  fontSize: '1.75rem',
  fontWeight: 700,
  color: 'var(--color-text)',
}

export const VIEW_INTRO: CSSProperties = {
  margin: '0 0 1.5rem',
  fontSize: '1rem',
  fontWeight: 500,
  color: 'var(--color-text)',
  textWrap: 'pretty',
}

export const LABEL: CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'var(--color-silver)',
}

export const PRIMARY_BUTTON: CSSProperties = {
  padding: '0.7rem 1.4rem',
  borderRadius: '0.6rem',
  fontWeight: 700,
  fontSize: '0.9rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: 'var(--color-bg)',
  background: 'linear-gradient(160deg, var(--color-bright, var(--color-primary)) 0%, var(--color-primary) 45%, var(--color-deep, var(--color-primary)) 100%)',
  border: '1px solid var(--color-deep, var(--color-primary))',
  boxShadow: '0 0 14px rgba(var(--glow-rgb), 0.4)',
}

export const GHOST_BUTTON: CSSProperties = {
  padding: '0.7rem 1.4rem',
  borderRadius: '0.6rem',
  fontWeight: 700,
  fontSize: '0.9rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  color: 'var(--color-silver)',
  background: 'transparent',
  border: '1px solid var(--color-border)',
}

export function stepBubble(done: boolean): CSSProperties {
  return {
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.05rem',
    fontWeight: 700,
    flexShrink: 0,
    background: done ? 'var(--color-primary)' : 'var(--color-surface)',
    color: done ? 'var(--color-bg)' : 'var(--color-silver)',
    border: done ? 'none' : '1px solid var(--color-border)',
  }
}

export function disabledIf(condition: boolean, style: CSSProperties): CSSProperties {
  return condition ? { ...style, opacity: 0.4, pointerEvents: 'none' } : style
}
