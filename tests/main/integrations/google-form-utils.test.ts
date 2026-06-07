import { describe, it, expect } from 'vitest'
import { findNameQuestion, findDiscordQuestion } from '../../../src/main/integrations/google-form-utils'
import type { FormQuestion } from '../../../src/main/integrations/google-form-utils'

describe('findNameQuestion', () => {
  it('finds exact match "name"', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'name' }, { id: '2', title: 'discord' }]
    expect(findNameQuestion(qs)?.id).toBe('1')
  })

  it('finds exact match "player name"', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'player name' }]
    expect(findNameQuestion(qs)?.id).toBe('1')
  })

  it('finds exact match "your name"', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'your name' }]
    expect(findNameQuestion(qs)?.id).toBe('1')
  })

  it('finds startsWith "name" when no exact match', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'name (required)' }]
    expect(findNameQuestion(qs)?.id).toBe('1')
  })

  it('finds includes "name" as fallback', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'full name' }]
    expect(findNameQuestion(qs)?.id).toBe('1')
  })

  it('excludes "game name" from all tiers', () => {
    const qs: FormQuestion[] = [
      { id: '1', title: 'game name' },
      { id: '2', title: 'your name' },
    ]
    expect(findNameQuestion(qs)?.id).toBe('2')
  })

  it('excludes "team name" from all tiers', () => {
    const qs: FormQuestion[] = [
      { id: '1', title: 'team name' },
      { id: '2', title: 'player name' },
    ]
    expect(findNameQuestion(qs)?.id).toBe('2')
  })

  it('returns undefined when no match', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'email' }, { id: '2', title: 'game' }]
    expect(findNameQuestion(qs)).toBeUndefined()
  })
})

describe('findDiscordQuestion', () => {
  it('finds exact match "discord"', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'discord' }]
    expect(findDiscordQuestion(qs)?.id).toBe('1')
  })

  it('finds exact match "discord handle"', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'discord handle' }]
    expect(findDiscordQuestion(qs)?.id).toBe('1')
  })

  it('finds exact match "discord username"', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'discord username' }]
    expect(findDiscordQuestion(qs)?.id).toBe('1')
  })

  it('finds exact match "discord tag"', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'discord tag' }]
    expect(findDiscordQuestion(qs)?.id).toBe('1')
  })

  it('finds partial match containing "discord"', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'what is your discord?' }]
    expect(findDiscordQuestion(qs)?.id).toBe('1')
  })

  it('returns undefined when no match', () => {
    const qs: FormQuestion[] = [{ id: '1', title: 'email' }]
    expect(findDiscordQuestion(qs)).toBeUndefined()
  })
})
