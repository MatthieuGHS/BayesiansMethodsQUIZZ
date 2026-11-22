import { isExactAnswer } from './quiz'
import { LETTERS, type Attempt, type Letter, type Outcome, type Question } from './types'

export interface State {
  /** Latest outcome per question id. A missing id has never been answered. */
  results: Record<string, Outcome>
  streak: number
  answered: number
  succeeded: number
  attempt: Attempt
}

export type Action =
  | { type: 'toggle'; letter: Letter }
  | { type: 'validate'; correct: Letter[] }
  | { type: 'show'; attempt: Attempt }
  | { type: 'reset'; attempt: Attempt }

export function initialState(attempt: Attempt): State {
  return { results: {}, streak: 0, answered: 0, succeeded: 0, attempt }
}

export function reducer(state: State, action: Action): State {
  const { attempt } = state
  switch (action.type) {
    case 'toggle': {
      if (attempt.revealed) return state
      const selected = attempt.selected.includes(action.letter)
        ? attempt.selected.filter((letter) => letter !== action.letter)
        : [...attempt.selected, action.letter]
      return { ...state, attempt: { ...attempt, selected } }
    }
    case 'validate': {
      if (attempt.revealed || !attempt.selected.length) return state
      const success = isExactAnswer(attempt.selected, action.correct)
      return {
        results: { ...state.results, [attempt.id]: success ? 'correct' : 'wrong' },
        streak: success ? state.streak + 1 : 0,
        answered: state.answered + 1,
        succeeded: state.succeeded + (success ? 1 : 0),
        attempt: { ...attempt, revealed: true },
      }
    }
    case 'show':
      return { ...state, attempt: action.attempt }
    case 'reset':
      return initialState(action.attempt)
  }
}

export function summarize({ results, answered, succeeded }: State, total: number) {
  const outcomes = Object.values(results)
  const correct = outcomes.filter((outcome) => outcome === 'correct').length
  return {
    correct,
    wrong: outcomes.length - correct,
    untouched: total - outcomes.length,
    rate: answered ? Math.round((100 * succeeded) / answered) : null,
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const count = (value: unknown) => (Number.isSafeInteger(value) && (value as number) >= 0 ? (value as number) : 0)
const isLetter = (value: unknown): value is Letter => LETTERS.includes(value as Letter)

function parseAttempt(value: unknown, known: ReadonlyMap<string, Question>): Attempt | null {
  if (!isRecord(value)) return null
  const { id, order, selected, revealed } = value
  if (typeof id !== 'string' || !known.has(id) || typeof revealed !== 'boolean') return null
  if (!Array.isArray(order) || order.length !== LETTERS.length || !LETTERS.every((letter) => order.includes(letter))) return null
  if (!Array.isArray(selected) || !selected.every(isLetter)) return null
  return { id, order, selected, revealed }
}

/** Turns whatever localStorage held into a valid state, keeping every part that is still usable. */
export function restoreState(saved: unknown, known: ReadonlyMap<string, Question>, fallback: () => Attempt): State {
  if (!isRecord(saved)) return initialState(fallback())
  const results: Record<string, Outcome> = {}
  if (isRecord(saved.results)) {
    for (const [id, outcome] of Object.entries(saved.results)) {
      if (known.has(id) && (outcome === 'correct' || outcome === 'wrong')) results[id] = outcome
    }
  }
  const answered = count(saved.answered)
  return {
    results,
    streak: count(saved.streak),
    answered,
    succeeded: Math.min(count(saved.succeeded), answered),
    attempt: parseAttempt(saved.attempt, known) ?? fallback(),
  }
}
