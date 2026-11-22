import { answer, expect, openQuestion, option, test } from './helpers'

const id = '2.8'
for (const scheme of ['light', 'dark'] as const) {
  test(`captures (${scheme})`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const shoot = (name: string, fullPage = true) =>
      page.screenshot({ path: `screenshots/${info.project.name}-${scheme}-${name}.png`, fullPage })

    await openQuestion(page, '1.1')
    await answer(page, '1.1', 'right')
    await openQuestion(page, '3.3')
    await answer(page, '3.3', 'wrong')

    await openQuestion(page, id)
    await option(page, 'b').click()
    await page.mouse.move(0, 0)
    await page.evaluate(() => scrollTo(0, 0))
    await shoot('1-question', false)

    await option(page, 'b').click()
    await answer(page, id, 'right')
    await page.mouse.move(0, 0)
    await page.evaluate(() => scrollTo(0, 0))
    await expect(page.getByTestId('verdict')).toHaveText('Juste')
    await shoot('2-juste')

    await openQuestion(page, id)
    await answer(page, id, 'wrong')
    await page.mouse.move(0, 0)
    await page.evaluate(() => scrollTo(0, 0))
    await shoot('3-faux-ecran', false)
    await shoot('3-faux')
  })
}
