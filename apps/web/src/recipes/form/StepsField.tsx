import buttons from '../../Button.module.css'
import { ids, type FieldErrors, type StepRow } from './formModel'
import styles from './RecipeForm.module.css'
import TextField from './TextField'

type StepsFieldProps = {
  rows: StepRow[]
  errors: FieldErrors['steps']
  listError?: string
  onChange: (key: string, text: string) => void
  onAdd: () => void
  onRemove: (key: string) => void
  onMove: (key: string, direction: 'up' | 'down') => void
}

function StepsField({
  rows,
  errors,
  listError,
  onChange,
  onAdd,
  onRemove,
  onMove,
}: StepsFieldProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Bereiding</legend>
      {rows.length > 0 && (
        <ol className={styles.rows}>
          {rows.map((row, index) => (
            <li key={row.key} className={styles.row}>
              <fieldset className={styles.rowGroup}>
                <legend className={styles.rowTitle}>Stap {index + 1}</legend>
                <TextField
                  id={ids.step(row.key)}
                  label="Omschrijving"
                  multiline
                  value={row.text}
                  error={errors[row.key]}
                  onChange={(text) => onChange(row.key, text)}
                />
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    id={`step-${row.key}-up`}
                    className={buttons.secondary}
                    aria-label={`Verplaats stap ${index + 1} omhoog`}
                    disabled={index === 0}
                    onClick={() => onMove(row.key, 'up')}
                  >
                    <span aria-hidden="true">↑</span> Omhoog
                  </button>
                  <button
                    type="button"
                    id={`step-${row.key}-down`}
                    className={buttons.secondary}
                    aria-label={`Verplaats stap ${index + 1} omlaag`}
                    disabled={index === rows.length - 1}
                    onClick={() => onMove(row.key, 'down')}
                  >
                    <span aria-hidden="true">↓</span> Omlaag
                  </button>
                  <button
                    type="button"
                    className={buttons.danger}
                    aria-label={`Stap ${index + 1} verwijderen`}
                    onClick={() => onRemove(row.key)}
                  >
                    Verwijderen
                  </button>
                </div>
              </fieldset>
            </li>
          ))}
        </ol>
      )}
      {listError && (
        <p className={styles.error}>
          <span className={styles.visuallyHidden}>Fout: </span>
          {listError}
        </p>
      )}
      <button
        type="button"
        id="add-step"
        className={buttons.secondary}
        onClick={onAdd}
      >
        Stap toevoegen
      </button>
    </fieldset>
  )
}

export default StepsField
