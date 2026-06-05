import type { PickQueueEntry } from '../../shared/types'

export function generatePickQueue(
  teamNames: string[],
  style: 'snake' | 'linear',
  rounds: number
): PickQueueEntry[] {
  const queue: PickQueueEntry[] = []
  let pickNumber = 1

  for (let round = 1; round <= rounds; round++) {
    const isReverse = style === 'snake' && round % 2 === 0
    const order = isReverse ? [...teamNames].reverse() : teamNames

    for (const teamName of order) {
      queue.push({ teamName, round, pickNumber })
      pickNumber++
    }
  }

  return queue
}
