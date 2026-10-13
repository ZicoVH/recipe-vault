import buttons from '../../Button.module.css'
import {
  ids,
  type FieldErrors,
  type IngredientField,
  type IngredientRow,
} from './formModel'
import styles from './RecipeForm.module.css'
import TextField from './TextField'
import UnitSelect from './UnitSelect'

type IngredientsFieldProps = {
  rows: IngredientRow[]
  errors: FieldErrors['ingredients']
  listError?: string
  onChange: (key: string, field: IngredientField, value: string) => void
  onAdd: () => void
  onRemove: (key: string) => void
}

function IngredientsField({
  rows,
  errors,
  listError,
  onChange,
  onAdd,
  onRemove,
}: IngredientsFieldProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Ingrediënten</legend>
      <p className={styles.hint}>
        Hoeveelheid en eenheid zijn optioneel. Een vrije omschrijving zoals ‘een
        snufje zout’ schrijf je in de naam.
      </p>
      {rows.length > 0 && (
        <ol className={styles.rows}>
          {rows.map((row, index) => {
            const rowErrors = errors[row.key] ?? {}
            return (
              <li key={row.key} className={styles.row}>
                <fieldset className={styles.rowGroup}>
                  <legend className={styles.rowTitle}>
                    Ingrediënt {index + 1}
                  </legend>
                  <div className={styles.pair}>
                    <TextField
                      id={ids.ingredient(row.key, 'quantity')}
                      label="Hoeveelheid"
                      inputMode="decimal"
                      value={row.quantity}
                      error={rowErrors.quantity}
                      onChange={(value) => onChange(row.key, 'quantity', value)}
                    />
                    <UnitSelect
                      id={ids.ingredient(row.key, 'unit')}
                      value={row.unit}
                      error={rowErrors.unit}
                      onChange={(value) => onChange(row.key, 'unit', value)}
                    />
                  </div>
                  <TextField
                    id={ids.ingredient(row.key, 'name')}
                    label="Naam"
                    value={row.name}
                    error={rowErrors.name}
                    onChange={(value) => onChange(row.key, 'name', value)}
                  />
                  <TextField
                    id={ids.ingredient(row.key, 'note')}
                    label="Opmerking (optioneel)"
                    value={row.note}
                    error={rowErrors.note}
                    onChange={(value) => onChange(row.key, 'note', value)}
                  />
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={buttons.danger}
                      aria-label={`Ingrediënt ${index + 1} verwijderen`}
                      onClick={() => onRemove(row.key)}
                    >
                      Verwijderen
                    </button>
                  </div>
                </fieldset>
              </li>
            )
          })}
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
        id="add-ingredient"
        className={buttons.secondary}
        onClick={onAdd}
      >
        Ingrediënt toevoegen
      </button>
    </fieldset>
  )
}

export default IngredientsField
