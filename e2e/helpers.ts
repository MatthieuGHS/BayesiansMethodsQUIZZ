import { readFileSync } from 'node:fs'
import { expect, test as base, type Page } from '@playwright/test'
import type { Question } from '../src/domain/types'

export const questions: Question[] = JSON.parse(readFileSync(new URL('../src/data/questions.json', import.meta.url), 'utf8'))
export const byId = (id: string) => questions.find((question) => question.id === id)!

/** Every test fails on a console error or warning, not only the loading one. */
export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ page }, use) => {
      const problems: string[] = []
      page.on('console', (message) => {
        if (message.type() !== 'error' && message.type() !== 'warning') return
        // Firefox flags the MathML that KaTeX emits for \mathcal and friends.
        if (/mathvariant=.* on MathML elements is deprecated|Inferring the accent(under)? property/.test(message.text())) return
        problems.push(message.text())
      })
      page.on('pageerror', (error) => problems.push(error.message))
      await use()
      expect(problems).toEqual([])
    },
    { auto: true },
  ],
})
export { expect }

export const cell = (page: Page, id: string) => page.locator(`.cell[data-id="${id}"]`)
export const option = (page: Page, letter: string) => page.locator(`.option[data-option="${letter}"]`)

export async function openQuestion(page: Page, id: string) {
  await cell(page, id).click()
  await expect(page.getByTestId('question-id')).toHaveText(id)
  await expect(page.locator('.option-open')).toHaveCount(5)
}

export async function answer(page: Page, id: string, how: 'right' | 'wrong') {
  const { correct, options } = byId(id)
  const picked = how === 'right' ? correct : [options.find((o) => !correct.includes(o.letter))!.letter]
  for (const letter of picked) await option(page, letter).click()
  await page.getByRole('button', { name: 'Valider', exact: true }).click()
}

export const displayedOrder = (page: Page) =>
  page.locator('.option').evaluateAll((items) => items.map((item) => item.getAttribute('data-option')!))
