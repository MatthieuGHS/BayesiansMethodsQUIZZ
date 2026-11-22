// shortcut: last tab to write wins, sync on the `storage` event if several open tabs become a need.
export const STATE_KEY = 'bmquizz:state'
export const THEME_KEY = 'bmquizz:theme'

export function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage can be blocked or full: the quiz keeps working in memory.
  }
}

export function readJson(key: string): unknown {
  try {
    return JSON.parse(read(key) ?? 'null')
  } catch {
    return null
  }
}
