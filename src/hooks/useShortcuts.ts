import { useEffect, useLayoutEffect } from 'react'
import { LETTERS } from '../domain/types'

function optionIndex({ key, code }: KeyboardEvent): number {
  // `code` covers AZERTY, where the unshifted digit row types & é " ' (.
  const digit = /^[1-5]$/.test(key) ? key : code.match(/^Digit([1-5])$/)?.[1]
  return digit ? Number(digit) - 1 : LETTERS.findIndex((letter) => letter === key.toLowerCase())
}

export function useShortcuts(onOption: (index: number) => void, onEnter: () => void) {
  // Layout effect: the listener must be current before the next key of a fast typist arrives.
  useLayoutEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]')) return
      if (event.key === 'Enter') {
        // Holding Enter must not validate and skip questions in a row.
        if (event.repeat) return event.preventDefault()
        if ((event.target as Element).closest?.('button, summary')) return
        event.preventDefault()
        onEnter()
        return
      }
      const index = optionIndex(event)
      if (index < 0 || event.repeat) return
      event.preventDefault()
      onOption(index)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onOption, onEnter])

  useEffect(() => {
    // A clicked button keeps focus and would swallow the Enter shortcut.
    function releaseFocus(event: MouseEvent) {
      if (event.detail) (event.target as Element).closest<HTMLElement>('button, summary')?.blur()
    }
    document.addEventListener('click', releaseFocus)
    return () => document.removeEventListener('click', releaseFocus)
  }, [])
}
