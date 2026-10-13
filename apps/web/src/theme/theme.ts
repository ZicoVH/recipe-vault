// EXPERIMENT: removed together with the theme switcher, see themes.css.

export const THEMES = [
  { id: 'editorial', label: 'Warm Editorial' },
  { id: 'sage', label: 'Modern Sage' },
  { id: 'midnight', label: 'Midnight Kitchen' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

const STORAGE_KEY = 'recipe-vault-theme'

function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value)
}

/** The stored choice. Storage can be blocked, so this never throws. */
function storedTheme(): ThemeId {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (isThemeId(value)) return value
  } catch {
    // Private mode or blocked storage: use the default.
  }
  return prefersDark() ? 'midnight' : THEMES[0].id
}

/** With nothing stored, follow the operating system like the app used to. */
function prefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export function currentTheme(): ThemeId {
  const value = document.documentElement.dataset.theme
  return isThemeId(value) ? value : THEMES[0].id
}

export function setTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // The theme still applies for this visit.
  }
}

/** Call once before the first render, so there is no flash of another theme. */
export function initTheme() {
  document.documentElement.dataset.theme = storedTheme()
}
