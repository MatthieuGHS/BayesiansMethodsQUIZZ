import { LETTERS, type Attempt, type Letter, type Question } from './types'

export type Random = () => number

export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function drawNext<T extends { id: string }>(items: readonly T[], previousId?: string, random: Random = Math.random): T {
  const pool = items.filter((item) => item.id !== previousId)
  return pool[Math.floor(random() * pool.length)]
}

export function newAttempt(question: Question, random: Random = Math.random): Attempt {
  return { id: question.id, order: shuffle(LETTERS, random), selected: [], revealed: false }
}

export function displayLetter(order: readonly Letter[], original: Letter): string {
  return LETTERS[order.indexOf(original)].toUpperCase()
}

export function isExactAnswer(selected: readonly Letter[], correct: readonly Letter[]): boolean {
  const chosen = new Set(selected)
  return chosen.size === correct.length && correct.every((letter) => chosen.has(letter))
}

/** The PDF gives a single explanation for some questions, copied on all five options in the data. */
export function sharedExplanation({ explanations }: Question): string | null {
  const texts = new Set(LETTERS.map((letter) => explanations[letter].text))
  return texts.size === 1 ? explanations.a.text : null
}

const OPTION_REFERENCE = /(\bcf\. |\boption |Contre-exemple : \()([a-e](?:, [a-e])*)(?=[\s).,;]|$)/g

/** Explanations cite PDF letters ("option a", "cf. b, c"): point them at the shuffled letters. */
export function relabelReferences(text: string, order: readonly Letter[]): string {
  return text.replace(OPTION_REFERENCE, (_, lead: string, letters: string) => {
    const shown = letters.split(', ').map((letter) => displayLetter(order, letter as Letter))
    return lead + shown.sort().join(', ')
  })
}
