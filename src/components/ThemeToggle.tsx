import { useTheme } from '../hooks/useTheme'
import { Icon } from './Icon'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
  return (
    <button type="button" className="icon-button" onClick={toggle} aria-label={label} title={label}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  )
}
