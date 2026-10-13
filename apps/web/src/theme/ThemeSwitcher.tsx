import { useId, useState } from 'react'
import { THEMES, currentTheme, setTheme } from './theme'
import type { ThemeId } from './theme'
import styles from './ThemeSwitcher.module.css'

// EXPERIMENT: temporary, see themes.css for how to remove it.
function ThemeSwitcher() {
  const id = useId()
  const [theme, setCurrent] = useState<ThemeId>(currentTheme)

  return (
    <div className={styles.switcher}>
      <label htmlFor={id} className={styles.label}>
        Thema
      </label>
      <select
        id={id}
        className={styles.select}
        value={theme}
        onChange={(event) => {
          const next = event.target.value as ThemeId
          setTheme(next)
          setCurrent(next)
        }}
      >
        {THEMES.map(({ id: value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ThemeSwitcher
