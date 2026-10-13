import styles from './RecipeForm.module.css'
import { COMMON_UNITS, KNOWN_UNITS, OTHER_UNITS } from './units'

type UnitSelectProps = {
  id: string
  value: string
  onChange: (value: string) => void
  error?: string
}

/**
 * A labelled dropdown of known units, the most used first. The empty choice
 * clears the unit, for ingredients without one.
 */
function UnitSelect({ id, value, onChange, error }: UnitSelectProps) {
  const errorId = `${id}-error`
  // A recipe saved or imported earlier may use a unit that is not in the
  // list. Keep it selectable, so editing does not silently drop it.
  const unknown = value !== '' && !KNOWN_UNITS.has(value)

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        Eenheid
      </label>
      <select
        id={id}
        className={styles.input}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Geen eenheid</option>
        {unknown && <option value={value}>{value} (huidige eenheid)</option>}
        <optgroup label="Veelgebruikt">
          {COMMON_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </optgroup>
        <optgroup label="Overige">
          {OTHER_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </optgroup>
      </select>
      {error && (
        <p id={errorId} className={styles.error}>
          <span className={styles.visuallyHidden}>Fout: </span>
          {error}
        </p>
      )}
    </div>
  )
}

export default UnitSelect
