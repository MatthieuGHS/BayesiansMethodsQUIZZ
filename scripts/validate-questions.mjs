import { readFileSync } from 'node:fs'
import katex from 'katex'

const LETTERS = ['a', 'b', 'c', 'd', 'e']
const UNCERTAIN = ['2.1', '2.6']
const MATH = /\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g
// A Greek letter or operator outside $...$ means a formula was left as plain text.
const RAW_MATH = /[\u0370-\u03ff\u2190-\u22ff^_\\{}]/u

const questions = JSON.parse(readFileSync(new URL('../src/data/questions.json', import.meta.url), 'utf8'))
const errors = []
const check = (ok, message) => ok || errors.push(message)
let formulas = 0

check(questions.length === 45, `45 questions attendues, ${questions.length} trouvées`)
check(new Set(questions.map((q) => q.id)).size === questions.length, 'ids en double')

for (const q of questions) {
  const at = `question ${q.id}`
  check(/^[1-6]\.\d+$/.test(q.id) && q.week === Number(q.id.split('.')[0]), `${at}: id ou semaine invalide`)
  check(q.uncertain === UNCERTAIN.includes(q.id), `${at}: statut incertain erroné`)
  check(q.options.map((o) => o.letter).join() === LETTERS.join(), `${at}: il faut exactement 5 options a–e`)
  check([1, 2].includes(q.correct.length), `${at}: 1 ou 2 réponses correctes attendues`)
  check(new Set(q.correct).size === q.correct.length, `${at}: réponse correcte en double`)
  check(q.correct.every((l) => LETTERS.includes(l)), `${at}: lettre correcte inconnue`)
  check(Object.keys(q.explanations).sort().join() === LETTERS.join(), `${at}: une explication par option attendue`)

  const verdicts = Object.entries(q.explanations)
  check(verdicts.every(([, e]) => e.verdict === 'V' || e.verdict === 'F'), `${at}: verdict inconnu`)
  const marked = verdicts.filter(([, e]) => e.verdict === 'V').map(([l]) => l)
  check(marked.sort().join() === [...q.correct].sort().join(), `${at}: verdicts V différents de "correct"`)

  const texts = [q.question, q.reference, q.rappel, ...q.options.map((o) => o.text), ...verdicts.map(([, e]) => e.text)]
  for (const text of texts) {
    check(text?.trim(), `${at}: texte vide`)
    const prose = text.replace(MATH, (_, display, inline) => {
      formulas++
      try {
        katex.renderToString(display ?? inline, { displayMode: Boolean(display), throwOnError: true, strict: 'error' })
      } catch (error) {
        errors.push(`${at}: ${error.message}`)
      }
      return ' '
    })
    check(!prose.includes('$'), `${at}: $ non apparié dans « ${text.slice(0, 60)} »`)
    check(!RAW_MATH.test(prose), `${at}: formule hors LaTeX (${prose.match(RAW_MATH)?.[0]})`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`questions.json valide : ${questions.length} questions, ${formulas} formules`)
