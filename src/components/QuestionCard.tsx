import { displayLetter, isExactAnswer, relabelReferences, sharedExplanation } from '../domain/quiz'
import type { Attempt, Letter, Question } from '../domain/types'
import { Icon } from './Icon'
import { OptionItem } from './OptionItem'
import { RichText } from './RichText'

interface Props {
  question: Question
  attempt: Attempt
  onToggle: (letter: Letter) => void
}

export function QuestionCard({ question, attempt, onToggle }: Props) {
  const { order, selected, revealed } = attempt
  const shared = sharedExplanation(question)

  return (
    <article className="question-enter">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
        <span className="font-bold text-primary">
          W0{question.week} · Question <span data-testid="question-id">{question.id}</span>
        </span>
        {question.uncertain && (
          <span className="rounded-md bg-note-soft px-2 py-0.5 text-note" title="réponses = lois avec paramètres">statut incertain</span>
        )}
      </p>

      <h2 id="question" tabIndex={-1} className="question" lang="en">
        <RichText text={question.question} inline />
      </h2>
      <p className="mt-2 text-sm text-muted">1 ou 2 bonnes réponses</p>

      <ul className="mt-5 grid grid-cols-1 gap-3" lang={revealed ? undefined : 'en'} aria-label="Options">
        {order.map((original) => {
          const { verdict, text } = question.explanations[original]
          return (
            <OptionItem
              key={original}
              original={original}
              letter={displayLetter(order, original)}
              text={question.options.find((option) => option.letter === original)!.text}
              selected={selected.includes(original)}
              correction={revealed ? { verdict, text: shared ? null : relabelReferences(text, order) } : undefined}
              onToggle={onToggle}
            />
          )
        })}
      </ul>

      {revealed && (
        <div className="reveal mt-5 grid grid-cols-1 gap-3">
          {shared && (
            <section className="panel px-4 py-3" data-testid="shared-explanation">
              <h3 className="mb-1 font-bold">Explication commune aux 5 options</h3>
              <div className="prose-math"><RichText text={relabelReferences(shared, order)} /></div>
            </section>
          )}
          <details className="panel rappel" open={!isExactAnswer(selected, question.correct)}>
            <summary>
              Rappel de cours
              <Icon name="chevron" className="chevron size-5" />
            </summary>
            <div className="prose-math border-t border-line px-4 py-4"><RichText text={question.rappel} /></div>
          </details>
          <div className="prose-math px-1 text-sm text-muted"><RichText text={`**Cours :** ${question.reference}`} /></div>
        </div>
      )}
    </article>
  )
}
