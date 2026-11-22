import type { Outcome } from '../domain/types'
import { Icon } from './Icon'

interface Props {
  outcome: Outcome | null
  canValidate: boolean
  onAction: () => void
}

export function ActionBar({ outcome, canValidate, onAction }: Props) {
  return (
    <footer className="action-bar">
      <div className="mx-auto flex max-w-3xl items-center gap-4">
        <div className="min-w-0 flex-1">
          <p role="status" data-testid="verdict" className={`flex items-center gap-1.5 text-lg font-bold empty:hidden ${outcome === 'correct' ? 'text-ok-ink' : 'text-bad-ink'}`}>
            {outcome && <Icon name={outcome === 'correct' ? 'check' : 'cross'} />}
            {outcome && (outcome === 'correct' ? 'Juste' : 'Raté')}
          </p>
          <p className="shortcuts">
            {!outcome && (
              <span><kbd>1</kbd>–<kbd>5</kbd> ou <kbd>A</kbd>–<kbd>E</kbd> cocher</span>
            )}
            <span><kbd>Entrée</kbd> {outcome ? 'suivante' : 'valider'}</span>
          </p>
        </div>
        <button type="button" className="button button-primary action" disabled={!outcome && !canValidate} onClick={(event) => {
            // The second click of a double-click would skip the correction just revealed.
            if (event.detail < 2) onAction()
          }}
        >
          {outcome ? 'Question suivante' : 'Valider'}
        </button>
      </div>
    </footer>
  )
}
