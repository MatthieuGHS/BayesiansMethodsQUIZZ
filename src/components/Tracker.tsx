import { memo } from 'react'
import { questions } from '../data'
import type { Outcome } from '../domain/types'
import { Icon } from './Icon'

const weeks = [...new Set(questions.map((question) => question.week))].map((week) => ({
  week,
  items: questions.filter((question) => question.week === week),
}))
const STATUS = { none: 'jamais faite', correct: 'réussie', wrong: 'ratée' }

interface Props {
  results: Partial<Record<string, Outcome>>
  currentId: string
  onPick: (id: string) => void
}

export const Tracker = memo(function Tracker({ results, currentId, onPick }: Props) {
  return (
    <nav className="tracker" aria-label="Suivi des 45 questions">
      {weeks.map(({ week, items }) => (
        <div key={week} className="week" style={{ flexGrow: items.length }}>
          <span className="week-label">W0{week}</span>
          <div className="week-cells">
            {items.map(({ id }) => {
              const status = results[id] ?? 'none'
              return (
                <button
                  key={id}
                  type="button"
                  className="cell"
                  data-id={id}
                  data-status={status}
                  aria-current={id === currentId || undefined}
                  aria-label={`Question ${id}, ${STATUS[status]}`}
                  onClick={() => onPick(id)}
                >
                  <span className="cell-box">
                    {status !== 'none' && <Icon name={status === 'correct' ? 'check' : 'cross'} className="size-3" />}
                  </span>
                  <span className="cell-tip" aria-hidden="true">{id}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
})
