import { answer, expect, openQuestion, questions, test } from './helpers'

for (const width of [320, 360, 390, 768, 1280]) {
  test(`les 45 questions se rendent sans débordement ni formule en erreur (${width} px)`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'les largeurs sont fixées par le test')
    test.setTimeout(180_000)
    await page.setViewportSize({ width, height: 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const problems: string[] = []
    const inspect = async (id: string) => {
      const found = await page.evaluate(() => {
        const issues: string[] = []
        if (document.documentElement.scrollWidth > innerWidth) issues.push('la page déborde')
        if (document.querySelector('.katex-error')) issues.push('erreur KaTeX')
        for (const base of document.querySelectorAll('main .katex-html > .base')) {
          if (base.closest('.table-scroll') || !base.checkVisibility()) continue
          const box = base.closest('.katex-display, .option-text, .prose-math, .question')!
          if (base.getBoundingClientRect().right > box.getBoundingClientRect().right + 1.5) {
            issues.push(`formule trop large : ${base.textContent?.slice(0, 40)}`)
          }
        }
        for (const scroller of document.querySelectorAll('.table-scroll')) {
          if (innerWidth >= 360 && scroller.checkVisibility() && scroller.scrollWidth > scroller.clientWidth + 1) {
            issues.push('tableau coupé')
          }
        }
        // Anything still holding a dollar sign is Markdown that failed to become math.
        if (document.querySelector('main')!.innerText.includes('$')) issues.push('LaTeX non rendu')
        return issues
      })
      problems.push(...found.map((issue) => `${id}: ${issue}`))
    }

    for (const { id } of questions) {
      await openQuestion(page, id)
      await inspect(id)
      await answer(page, id, 'wrong')
      await expect(page.locator('details.rappel')).toHaveAttribute('open', '')
      await inspect(id)
    }
    expect(problems).toEqual([])
  })
}

test('les cibles tactiles restent confortables', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile seulement')
  await page.goto('/')
  const size = async (selector: string) => (await page.locator(selector).first().boundingBox())!
  expect((await size('.option-open')).height).toBeGreaterThanOrEqual(56)
  expect((await size('.action')).height).toBeGreaterThanOrEqual(48)
  expect((await size('.icon-button')).height).toBeGreaterThanOrEqual(44)
  const box = await size('.cell')
  expect(box.width).toBeGreaterThanOrEqual(36)
  expect(box.height).toBeGreaterThanOrEqual(24)
})
