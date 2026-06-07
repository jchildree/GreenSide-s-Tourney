export interface FormQuestion {
  id: string
  title: string // lowercased by caller
}

export function findNameQuestion(questions: FormQuestion[]): FormQuestion | undefined {
  return (
    questions.find(q =>
      q.title === 'name' || q.title === 'player name' || q.title === 'your name'
    ) ??
    questions.find(q =>
      q.title.startsWith('name') && !q.title.includes('game') && !q.title.includes('team')
    ) ??
    questions.find(q =>
      q.title.includes('name') && !q.title.includes('game') && !q.title.includes('team')
    )
  )
}

export function findDiscordQuestion(questions: FormQuestion[]): FormQuestion | undefined {
  return (
    questions.find(q =>
      q.title === 'discord' ||
      q.title === 'discord handle' ||
      q.title === 'discord username' ||
      q.title === 'discord tag'
    ) ??
    questions.find(q => q.title.includes('discord'))
  )
}
