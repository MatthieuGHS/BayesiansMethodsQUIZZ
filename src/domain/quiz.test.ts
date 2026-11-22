import { describe, expect, it } from 'vitest'
import { questionById, questions } from '../data'
import { displayLetter, drawNext, isExactAnswer, newAttempt, relabelReferences, sharedExplanation, shuffle } from './quiz'
import { LETTERS, type Letter } from './types'

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]]
  return items.flatMap((item, i) => permutations(items.toSpliced(i, 1)).map((rest) => [item, ...rest]))
}

const subsets = Array.from({ length: 32 }, (_, mask) => LETTERS.filter((_, i) => mask & (1 << i)))

describe('mélange des options', () => {
  it('produit les 120 ordres possibles, chacun avec les 5 options', () => {
    const random = seeded(42)
    const seen = new Set<string>()
    for (let i = 0; i < 5000; i++) {
      const order = shuffle(LETTERS, random)
      expect([...order].sort()).toEqual([...LETTERS])
      seen.add(order.join(''))
    }
    expect(seen.size).toBe(120)
  })

  it('conserve la bonne correction quel que soit l’ordre', () => {
    for (const question of questions) {
      const trueTexts = question.options.filter((o) => question.correct.includes(o.letter)).map((o) => o.text)
      for (const order of permutations(LETTERS)) {
        const shown = order.map((letter) => question.options.find((o) => o.letter === letter)!.text)
        // What a player does: tick the positions where the true sentences are displayed.
        const ticked = shown.flatMap((text, position) => (trueTexts.includes(text) ? [order[position]] : []))
        expect(isExactAnswer(ticked, question.correct)).toBe(true)
      }
    }
  })

  it('réattribue A à E selon la position affichée', () => {
    const order: Letter[] = ['d', 'a', 'e', 'c', 'b']
    expect(order.map((letter) => displayLetter(order, letter))).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(displayLetter(order, 'b')).toBe('E')
  })

  it('démarre chaque affichage sans case cochée', () => {
    expect(newAttempt(questions[0])).toMatchObject({ id: '1.1', selected: [], revealed: false })
  })
})

describe('tirage', () => {
  it('ne renvoie jamais deux fois de suite la même question', () => {
    const random = seeded(7)
    let previous = drawNext(questions, undefined, random)
    for (let i = 0; i < 50_000; i++) {
      const next = drawNext(questions, previous.id, random)
      expect(next.id).not.toBe(previous.id)
      previous = next
    }
  })

  it('évite la précédente même aux bornes du générateur', () => {
    for (const { id } of questions) {
      for (const value of [0, 0.999999999]) expect(drawNext(questions, id, () => value).id).not.toBe(id)
    }
  })

  it('peut tirer les 44 autres, donc avec remise', () => {
    const drawn = Array.from({ length: 44 }, (_, i) => drawNext(questions, '2.8', () => (i + 0.5) / 44).id)
    expect(new Set(drawn).size).toBe(44)
  })
})

describe('correction', () => {
  it('exige l’ensemble exact, pour les 32 combinaisons de chaque question', () => {
    for (const question of questions) {
      const expected = [...question.correct].sort().join()
      for (const selected of subsets) expect(isExactAnswer(selected, question.correct)).toBe(selected.join() === expected)
    }
  })

  it('refuse une réponse partielle ou trop large, et ignore l’ordre de cochage', () => {
    expect(isExactAnswer(['b'], ['b', 'd'])).toBe(false)
    expect(isExactAnswer(['b', 'c', 'd'], ['b', 'd'])).toBe(false)
    expect(isExactAnswer(['d', 'b'], ['b', 'd'])).toBe(true)
  })
})

describe('explications', () => {
  // a→E, b→D, c→C, d→B, e→A
  const reversed: Letter[] = ['e', 'd', 'c', 'b', 'a']

  it('réattribue toutes les lettres citées dans le PDF, et rien d’autre', () => {
    const changed = questions.flatMap((question) =>
      [...new Set(LETTERS.map((letter) => question.explanations[letter].text))]
        .filter((text) => relabelReferences(text, reversed) !== text)
        .map(() => question.id),
    )
    expect(changed).toEqual(['1.2', '1.7', '2.1', '2.6', '3.3', '3.4', '3.7', '4.4', '4.10', '5.4'])
  })

  it.each([
    ['(cf. a).', '(cf. E).'],
    ['(cf. b, c, d).', '(cf. B, C, D).'],
    ['Contre-exemple : (e).', 'Contre-exemple : (A).'],
    ['(option a), ou (option e).', '(option E), ou (option A).'],
    ['donc l’option e est fausse.', 'donc l’option A est fausse.'],
    ['(cf. 5.3), Ex. 2(d)', '(cf. 5.3), Ex. 2(d)'],
  ])('%s', (source, shown) => {
    expect(relabelReferences(source, reversed)).toBe(shown)
  })

  it('reconnaît les 8 questions à explication commune', () => {
    expect(questions.filter(sharedExplanation).map((q) => q.id)).toEqual(['2.1', '2.6', '3.8', '4.4', '4.9', '5.4', '5.8', '6.8'])
    expect(sharedExplanation(questionById.get('5.7')!)).toBeNull()
  })
})
