export const LETTERS = ['a', 'b', 'c', 'd', 'e'] as const
export type Letter = (typeof LETTERS)[number]

export interface Question {
  id: string
  week: number
  uncertain: boolean
  question: string
  options: { letter: Letter; text: string }[]
  correct: Letter[]
  explanations: Record<Letter, { verdict: 'V' | 'F'; text: string }>
  reference: string
  rappel: string
}

/** One display of a question. Every letter stored here is an original PDF letter. */
export interface Attempt {
  id: string
  /** order[0] is displayed as A, order[1] as B, and so on. */
  order: Letter[]
  selected: Letter[]
  revealed: boolean
}

export type Outcome = 'correct' | 'wrong'
