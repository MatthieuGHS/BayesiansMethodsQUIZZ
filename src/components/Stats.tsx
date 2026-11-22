import { questions } from '../data'
import { summarize, type State } from '../domain/progress'

export function Stats({ state }: { state: State }) {
  const { correct, wrong, untouched, rate } = summarize(state, questions.length)
  const counters = [
    { key: 'correct', value: correct, color: 'bg-ok', label: 'réussies' },
    { key: 'wrong', value: wrong, color: 'bg-bad', label: 'ratées' },
    { key: 'none', value: untouched, color: 'bg-idle', label: 'jamais faites' },
  ]
  return (
    <div className="stats">
      <p className="flex gap-3">
        {counters.map(({ key, value, color, label }) => (
          <span key={key} className="flex items-center gap-1.5" title={label}>
            <span className={`size-2.5 rounded-[3px] ${color}`} aria-hidden="true" />
            <strong data-testid={`count-${key}`}>{value}</strong>
            <span className="sr-only">{label}</span>
          </span>
        ))}
      </p>
      <p className="flex gap-3">
        <span className="text-muted">
          Série <strong className="text-ink" data-testid="streak">{state.streak}</strong>
        </span>
        <span className="text-muted">
          Réussite{' '}
          <strong className="whitespace-nowrap text-ink" data-testid="rate">{rate === null ? '–' : `${rate}\u00a0%`}</strong>
        </span>
      </p>
    </div>
  )
}
