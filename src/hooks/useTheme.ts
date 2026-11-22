import { useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { read, THEME_KEY, write } from '../storage'

type Theme = 'light' | 'dark'
const media = matchMedia('(prefers-color-scheme: dark)')

function subscribe(onChange: () => void) {
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function useTheme() {
  const system = useSyncExternalStore(subscribe, (): Theme => (media.matches ? 'dark' : 'light'))
  const [choice, setChoice] = useState(() => read(THEME_KEY))
  const theme: Theme = choice === 'light' || choice === 'dark' ? choice : system

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function toggle() {
    const target: Theme = theme === 'dark' ? 'light' : 'dark'
    // Landing back on the system theme means following the system again.
    const next = target === system ? null : target
    setChoice(next)
    write(THEME_KEY, next)
  }

  return { theme, toggle }
}
