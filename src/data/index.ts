import type { Question } from '../domain/types'
import data from './questions.json'

// The cast is safe because `npm run build` runs scripts/validate-questions.mjs first.
export const questions = data as Question[]
export const questionById = new Map(questions.map((question) => [question.id, question]))
