import { useCallback, useEffect, useLayoutEffect, useReducer } from 'react'
import { ActionBar } from './components/ActionBar'
import { QuestionCard } from './components/QuestionCard'
import { ResetButton } from './components/ResetButton'
import { Stats } from './components/Stats'
import { ThemeToggle } from './components/ThemeToggle'
import { Tracker } from './components/Tracker'
import { questionById, questions } from './data'
import { reducer, restoreState } from './domain/progress'
import { drawNext, isExactAnswer, newAttempt } from './domain/quiz'
import type { Letter } from './domain/types'
import { useShortcuts } from './hooks/useShortcuts'
import { readJson, STATE_KEY, write } from './storage'

const randomAttempt = (previousId?: string) => newAttempt(drawNext(questions, previousId))
const load = () => restoreState(readJson(STATE_KEY), questionById, randomAttempt)

export function App() {
  const [state, dispatch] = useReducer(reducer, null, load)
  const { attempt } = state
  const question = questionById.get(attempt.id)!
  const attemptKey = `${attempt.id}:${attempt.order.join('')}`
  const outcome = attempt.revealed ? (isExactAnswer(attempt.selected, question.correct) ? 'correct' : 'wrong') : null

  useEffect(() => write(STATE_KEY, JSON.stringify(state)), [state])

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [attemptKey])

  useLayoutEffect(() => {
    document.getElementById('question')?.focus({ preventScroll: true })
  }, [attemptKey, attempt.revealed])

  const toggle = useCallback((letter: Letter) => dispatch({ type: 'toggle', letter }), [])
  const pick = useCallback((id: string) => dispatch({ type: 'show', attempt: newAttempt(questionById.get(id)!) }), [])

  function advance() {
    if (attempt.revealed) dispatch({ type: 'show', attempt: randomAttempt(attempt.id) })
    else dispatch({ type: 'validate', correct: question.correct })
  }

  useShortcuts((index) => toggle(attempt.order[index]), advance)

  return (
    <>
      <header className="topbar">
        <h1 className="sr-only">Bayesian Methods, révision en boucle</h1>
        <div className="topbar-inner">
          <div className="topbar-side">
            <Stats state={state} />
            <div className="flex gap-1">
              <ThemeToggle />
              <ResetButton onReset={() => dispatch({ type: 'reset', attempt: randomAttempt(attempt.id) })} />
            </div>
          </div>
          <Tracker results={state.results} currentId={attempt.id} onPick={pick} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-8 sm:pt-9">
        <QuestionCard key={attemptKey} question={question} attempt={attempt} onToggle={toggle} />
      </main>
      <ActionBar outcome={outcome} canValidate={attempt.selected.length > 0} onAction={advance} />
    </>
  )
}
