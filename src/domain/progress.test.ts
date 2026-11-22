import { expect, it } from 'vitest'
import { questionById } from '../data'
import { initialState, reducer, restoreState, summarize, type State } from './progress'
import type { Attempt, Letter } from './types'

const fresh = (): Attempt => ({ id: '1.1', order: ['c', 'b', 'a', 'e', 'd'], selected: [], revealed: false })
const answer = (state: State, letters: Letter[]) => {
  let next = reducer(state, { type: 'show', attempt: fresh() })
  for (const letter of letters) next = reducer(next, { type: 'toggle', letter })
  return reducer(next, { type: 'validate', correct: ['b', 'd'] })
}

it('garde la dernière tentative, la série et le taux global', () => {
  let state = answer(answer(initialState(fresh()), ['b', 'd']), ['d', 'b'])
  expect(state).toMatchObject({ results: { '1.1': 'correct' }, streak: 2 })
  state = answer(state, ['b'])
  expect(state).toMatchObject({ results: { '1.1': 'wrong' }, streak: 0 })
  expect(summarize(state, 45)).toEqual({ correct: 0, wrong: 1, untouched: 44, rate: 67 })
})

it('ne compte ni une validation vide ni une double validation', () => {
  const empty = initialState(fresh())
  expect(reducer(empty, { type: 'validate', correct: ['b'] })).toBe(empty)
  const done = answer(empty, ['b', 'd'])
  expect(reducer(done, { type: 'validate', correct: ['b', 'd'] })).toBe(done)
  expect(reducer(done, { type: 'toggle', letter: 'a' })).toBe(done)
})

it('remet tout à zéro', () => {
  expect(reducer(answer(initialState(fresh()), ['b']), { type: 'reset', attempt: fresh() })).toEqual(initialState(fresh()))
})

it('restaure un état sauvegardé à l’identique', () => {
  const state = answer(initialState(fresh()), ['b', 'd'])
  expect(restoreState(JSON.parse(JSON.stringify(state)), questionById, fresh)).toEqual(state)
})

it('survit à un stockage corrompu', () => {
  for (const junk of [null, 3, 'x', [], {}, { attempt: { id: '9.9' } }, { results: 4, answered: -1, succeeded: 'x' }]) {
    expect(restoreState(junk, questionById, fresh)).toEqual(initialState(fresh()))
  }
  const partial = { results: { '2.8': 'wrong', '9.9': 'correct', '3.3': 'maybe' }, attempt: { ...fresh(), order: ['a'] } }
  expect(restoreState(partial, questionById, fresh)).toMatchObject({ results: { '2.8': 'wrong' }, attempt: fresh() })
})
