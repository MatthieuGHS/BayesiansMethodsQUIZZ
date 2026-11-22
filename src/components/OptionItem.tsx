import type { Letter } from '../domain/types'
import { Icon } from './Icon'
import { RichText } from './RichText'

interface Props {
  original: Letter
  letter: string
  text: string
  selected: boolean
  /** Present once the answer is validated. */
  correction?: { verdict: 'V' | 'F'; text: string | null }
  onToggle: (letter: Letter) => void
}

function mark(isTrue: boolean, selected: boolean) {
  if (isTrue) return selected ? { key: 'hit', label: 'Bien cochée' } : { key: 'missed', label: 'Oubliée' }
  return selected ? { key: 'false-pick', label: 'Cochée à tort' } : { key: 'rejected', label: null }
}

export function OptionItem({ original, letter, text, selected, correction, onToggle }: Props) {
  if (!correction) {
    return (
      <li>
        <label className="option option-open" data-option={original}>
          <input type="checkbox" className="sr-only" checked={selected} onChange={() => onToggle(original)} />
          <span className="option-letter">{letter}</span>
          <span className="option-text"><RichText text={text} inline /></span>
          <span className="option-check" aria-hidden="true"><Icon name="check" className="size-4" /></span>
        </label>
      </li>
    )
  }

  const isTrue = correction.verdict === 'V'
  const { key, label } = mark(isTrue, selected)
  return (
    <li className="option option-closed" data-option={original} data-mark={key} data-verdict={correction.verdict}>
      <span className="option-letter">{letter}</span>
      <div className="option-text">
        <span lang="en"><RichText text={text} inline /></span>
        <div className="explanation">
          <p className="verdict">
            <Icon name={isTrue ? 'check' : 'cross'} className="size-4" />
            <span>{isTrue ? 'V · Vrai' : 'F · Faux'}</span>
            {label && <span className="mark">{label}</span>}
          </p>
          {correction.text && <div className="prose-math"><RichText text={correction.text} /></div>}
        </div>
      </div>
    </li>
  )
}
