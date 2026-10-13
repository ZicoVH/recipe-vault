import buttons from '../../Button.module.css'
import { ids } from './formModel'
import styles from './RecipeForm.module.css'

type TagsFieldProps = {
  tags: string[]
  input: string
  error: string | null
  onInputChange: (value: string) => void
  onAdd: () => void
  onRemove: (tag: string) => void
}

function TagsField({
  tags,
  input,
  error,
  onInputChange,
  onAdd,
  onRemove,
}: TagsFieldProps) {
  const errorId = `${ids.tagInput}-error`
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Tags</legend>
      {tags.length > 0 && (
        <ul className={styles.tagList}>
          {tags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                className={styles.tag}
                aria-label={`Tag ${tag} verwijderen`}
                onClick={() => onRemove(tag)}
              >
                {tag} <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <label htmlFor={ids.tagInput} className={styles.label}>
        Nieuwe tag
      </label>
      <div className={styles.tagAdd}>
        <input
          id={ids.tagInput}
          type="text"
          className={styles.input}
          value={input}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            // Enter adds the tag instead of submitting the whole form.
            if (event.key === 'Enter') {
              event.preventDefault()
              onAdd()
            }
          }}
        />
        <button type="button" className={buttons.secondary} onClick={onAdd}>
          Toevoegen
        </button>
      </div>
      <div aria-live="polite">
        {error && (
          <p id={errorId} className={styles.error}>
            <span className={styles.visuallyHidden}>Fout: </span>
            {error}
          </p>
        )}
      </div>
    </fieldset>
  )
}

export default TagsField
