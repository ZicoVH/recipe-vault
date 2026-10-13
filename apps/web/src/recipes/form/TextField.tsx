import styles from './RecipeForm.module.css'

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  multiline?: boolean
  inputMode?: 'text' | 'numeric' | 'decimal'
  autoComplete?: string
}

/** A labelled input or textarea whose error is announced with the field. */
function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  multiline = false,
  inputMode,
  autoComplete = 'off',
}: TextFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') ||
    undefined
  const shared = {
    id,
    className: styles.input,
    value,
    autoComplete,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {multiline ? (
        <textarea
          {...shared}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          {...shared}
          type="text"
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          <span className={styles.visuallyHidden}>Fout: </span>
          {error}
        </p>
      )}
    </div>
  )
}

export default TextField
