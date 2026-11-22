import { answer, byId, cell, displayedOrder, expect, openQuestion, option, questions, test } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('se charge sans erreur, avec 45 cases grises groupées par semaine', async ({ page }) => {
  await expect(page.locator('.cell')).toHaveCount(45)
  await expect(page.locator('.cell[data-status="none"]')).toHaveCount(45)
  await expect(page.locator('.week-label')).toHaveText(['W01', 'W02', 'W03', 'W04', 'W05', 'W06'])
  await expect(page.locator('.option-open')).toHaveCount(5)
  await expect(page.getByText('1 ou 2 bonnes réponses')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Valider', exact: true })).toBeDisabled()
})

for (const id of ['2.8', '2.1']) {
  test(`répondre juste à ${id} fait passer sa case au vert`, async ({ page }) => {
    await openQuestion(page, id)
    await answer(page, id, 'right')
    await expect(page.getByTestId('verdict')).toHaveText('Juste')
    await expect(cell(page, id)).toHaveAttribute('data-status', 'correct')
    await expect(cell(page, id).locator('.cell-box')).toHaveCSS('background-color', 'rgb(5, 150, 105)')
    await expect(page.locator('details.rappel')).not.toHaveAttribute('open')
    await expect(page.getByTestId('count-correct')).toHaveText('1')
    await expect(page.getByTestId('streak')).toHaveText('1')
  })

  test(`répondre faux à ${id} fait passer sa case au rouge`, async ({ page }) => {
    await openQuestion(page, id)
    await answer(page, id, 'wrong')
    await expect(page.getByTestId('verdict')).toHaveText('Raté')
    await expect(cell(page, id)).toHaveAttribute('data-status', 'wrong')
    await expect(cell(page, id).locator('.cell-box')).toHaveCSS('background-color', 'rgb(220, 38, 38)')
    await expect(page.locator('details.rappel')).toHaveAttribute('open', '')
    await expect(page.getByText('Cochée à tort')).toBeVisible()
    await expect(page.getByText('Oubliée')).toHaveCount(byId(id).correct.length)
  })
}

test('une réponse partielle est fausse', async ({ page }) => {
  await openQuestion(page, '2.8')
  await option(page, 'b').click()
  await page.getByRole('button', { name: 'Valider', exact: true }).click()
  await expect(cell(page, '2.8')).toHaveAttribute('data-status', 'wrong')
})

test('une réponse trop large est fausse', async ({ page }) => {
  await openQuestion(page, '2.8')
  for (const letter of ['a', 'b', 'd']) await option(page, letter).click()
  await page.getByRole('button', { name: 'Valider', exact: true }).click()
  await expect(cell(page, '2.8')).toHaveAttribute('data-status', 'wrong')
})

test('la dernière tentative donne la couleur de la case', async ({ page }) => {
  await openQuestion(page, '1.8')
  await answer(page, '1.8', 'wrong')
  await openQuestion(page, '1.8')
  await answer(page, '1.8', 'right')
  await expect(cell(page, '1.8')).toHaveAttribute('data-status', 'correct')
  await expect(page.getByTestId('rate')).toHaveText(/50\s%/)
})

test('cliquer sur une case affiche la bonne question', async ({ page }) => {
  for (const id of ['1.1', '3.11', '6.11', '4.9']) {
    await openQuestion(page, id)
    await expect(page.locator('#question')).toContainText(byId(id).question.split('$')[0].trim().slice(0, 25))
    await expect(cell(page, id)).toHaveAttribute('aria-current', 'true')
    await expect(page.locator('.cell[aria-current]')).toHaveCount(1)
  }
})

test('cliquer sur une case remélange les options', async ({ page }) => {
  const orders = new Set<string>()
  for (let i = 0; i < 8; i++) {
    await openQuestion(page, '1.2')
    orders.add((await displayedOrder(page)).join(''))
  }
  expect(orders.size).toBeGreaterThan(1)
})

test('la boucle continue sans jamais répéter la question précédente', async ({ page }) => {
  let previous = await page.getByTestId('question-id').textContent()
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('1')
    await page.keyboard.press('Enter')
    await expect(page.locator('.option-closed')).toHaveCount(5)
    await page.keyboard.press('Enter')
    await expect(page.locator('.option-open')).toHaveCount(5)
    const current = await page.getByTestId('question-id').textContent()
    expect(current).not.toBe(previous)
    previous = current
  }
})

test('touches 1 à 5 puis Entrée, sans souris', async ({ page }) => {
  const id = (await page.getByTestId('question-id').textContent())!
  const order = await displayedOrder(page)
  const boxes = page.locator('.option-open input')
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press(String(i + 1))
    await expect(boxes.nth(i)).toBeChecked()
    await page.keyboard.press(String(i + 1))
    await expect(boxes.nth(i)).not.toBeChecked()
  }
  for (const letter of byId(id).correct) await page.keyboard.press(String(order.indexOf(letter) + 1))
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('verdict')).toHaveText('Juste')
  await page.keyboard.press('Enter')
  await expect(page.locator('.option-open')).toHaveCount(5)
  await expect(page.getByTestId('question-id')).not.toHaveText(id)
})

test('touches A à E', async ({ page }) => {
  const boxes = page.locator('.option-open input')
  for (const [i, key] of ['a', 'b', 'c', 'd', 'e'].entries()) {
    await page.keyboard.press(key)
    await expect(boxes.nth(i)).toBeChecked()
  }
})

test('la rangée de chiffres marche en AZERTY', async ({ page }) => {
  for (const [i, key] of ['&', 'é', '"', "'", '('].entries()) {
    await page.evaluate(
      ([key, code]) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true })),
      [key, `Digit${i + 1}`],
    )
    await expect(page.locator('.option-open input').nth(i)).toBeChecked()
  }
})

test('Entrée marche encore après un clic sur une case, une option ou le thème', async ({ page }) => {
  await openQuestion(page, '4.7')
  await option(page, 'c').click()
  await page.getByRole('button', { name: /Passer en mode/ }).click()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('verdict')).toHaveText('Juste')
  await page.locator('details.rappel summary').click()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('question-id')).not.toHaveText('4.7')
})

test('Entrée maintenue ne saute pas de question', async ({ page }) => {
  await page.keyboard.press('1')
  await page.keyboard.down('Enter')
  await page.keyboard.down('Enter')
  await page.keyboard.down('Enter')
  await page.keyboard.up('Enter')
  await expect(page.locator('.option-closed')).toHaveCount(5)
})

test('un double-clic sur Valider ne saute pas la correction', async ({ page }) => {
  await openQuestion(page, '3.6')
  await option(page, 'a').click()
  await page.getByRole('button', { name: 'Valider', exact: true }).dblclick()
  await expect(page.getByTestId('question-id')).toHaveText('3.6')
  await expect(page.locator('.option-closed')).toHaveCount(5)
})

test('une rafale de touches ne perd aucune réponse', async ({ page }) => {
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('2')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')
  }
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('bmquizz:state')!).answered)).toBe(40)
})

test('Entrée sans case cochée ne valide pas', async ({ page }) => {
  await page.keyboard.press('Enter')
  await expect(page.locator('.option-open')).toHaveCount(5)
})

test('les lettres citées dans les explications suivent le mélange', async ({ page }) => {
  await openQuestion(page, '1.2')
  const shown = 'ABCDE'[(await displayedOrder(page)).indexOf('a')]
  await answer(page, '1.2', 'wrong')
  await expect(option(page, 'b')).toContainText(`(cf. ${shown})`)
})

test('une explication commune n’est affichée qu’une fois', async ({ page }) => {
  await openQuestion(page, '5.8')
  await answer(page, '5.8', 'right')
  await expect(page.getByTestId('shared-explanation')).toHaveCount(1)
  await expect(page.getByText('WAIC échoue aussi dans ces cas')).toHaveCount(1)
})

test('l’état survit à un rechargement', async ({ page }) => {
  await openQuestion(page, '1.1')
  await answer(page, '1.1', 'right')
  await openQuestion(page, '6.9')
  await answer(page, '6.9', 'wrong')
  const order = await displayedOrder(page)
  await page.reload()
  await expect(cell(page, '1.1')).toHaveAttribute('data-status', 'correct')
  await expect(cell(page, '6.9')).toHaveAttribute('data-status', 'wrong')
  await expect(page.getByTestId('question-id')).toHaveText('6.9')
  await expect(page.getByTestId('verdict')).toHaveText('Raté')
  await expect(page.getByTestId('rate')).toHaveText(/50\s%/)
  expect(await displayedOrder(page)).toEqual(order)
})

test('l’app fonctionne si localStorage est bloqué', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get: () => { throw new DOMException('blocked', 'SecurityError') } })
  })
  await page.reload()
  await openQuestion(page, '2.7')
  await answer(page, '2.7', 'right')
  await expect(cell(page, '2.7')).toHaveAttribute('data-status', 'correct')
})

test('réinitialiser demande confirmation', async ({ page }) => {
  await openQuestion(page, '3.4')
  await answer(page, '3.4', 'right')
  const reset = page.getByRole('button', { name: 'Réinitialiser' })
  await reset.click()
  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(cell(page, '3.4')).toHaveAttribute('data-status', 'correct')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeHidden()

  await reset.click()
  await page.getByRole('dialog').getByRole('button', { name: 'Réinitialiser' }).click()
  await expect(page.locator('.cell[data-status="none"]')).toHaveCount(questions.length)
  await page.reload()
  await expect(page.locator('.cell[data-status="none"]')).toHaveCount(questions.length)
})

test('le thème suit le système, puis la bascule', async ({ page }) => {
  const html = page.locator('html')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Passer en mode clair' }).click()
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Passer en mode sombre' }).click()
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(html).toHaveAttribute('data-theme', 'light')
})

test('l’infobulle d’une case donne son id', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pas de survol au doigt')
  await cell(page, '5.10').hover()
  await expect(cell(page, '5.10').locator('.cell-tip')).toBeVisible()
  await expect(cell(page, '5.10').locator('.cell-tip')).toHaveText('5.10')
})
