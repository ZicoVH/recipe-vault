import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useActionData, useNavigation, useSubmit } from 'react-router'
import buttons from '../../Button.module.css'
import type { Recipe } from '../types'
import type { SaveResult } from './formActions'
import {
  addTag,
  emptyIngredient,
  emptyStep,
  ids,
  initialValues,
  mapServerErrors,
  validate,
} from './formModel'
import type {
  FieldErrors,
  FormValues,
  IngredientField,
  SubmittedKeys,
  SummaryItem,
} from './formModel'
import IngredientsField from './IngredientsField'
import styles from './RecipeForm.module.css'
import StepsField from './StepsField'
import TagsField from './TagsField'
import TextField from './TextField'

type RecipeFormProps = {
  /** The recipe to edit, or null to create a new one. */
  recipe: Recipe | null
}

type Issues = { errors: FieldErrors; summary: SummaryItem[] }

const noErrors: FieldErrors = { ingredients: {}, steps: {} }

function focusById(id: string) {
  document.getElementById(id)?.focus()
}

function RecipeForm({ recipe }: RecipeFormProps) {
  const [values, setValues] = useState<FormValues>(() => initialValues(recipe))
  const [clientIssues, setClientIssues] = useState<Issues | null>(null)
  const [submittedKeys, setSubmittedKeys] = useState<SubmittedKeys>({
    ingredients: [],
    steps: [],
  })
  const [tagError, setTagError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState({ text: '', count: 0 })
  // The save result the user has already moved past, so it is not shown again.
  const [dismissed, setDismissed] = useState<SaveResult | undefined>(undefined)
  const [attempt, setAttempt] = useState(0)

  const actionData = useActionData<SaveResult>()
  const navigation = useNavigation()
  const submit = useSubmit()
  // Also true while the redirect after a successful save loads, so a second
  // click cannot save the same recipe twice.
  const submitting = navigation.state !== 'idle'

  const summaryRef = useRef<HTMLDivElement>(null)
  // Focus to apply after the next render, once the new elements exist.
  const pendingFocus = useRef<(() => void) | null>(null)

  const result = actionData === dismissed ? undefined : actionData
  const serverIssues =
    result?.status === 'invalid'
      ? mapServerErrors(result.fields, submittedKeys, {
          ingredients: values.ingredients.map((row) => row.key),
          steps: values.steps.map((row) => row.key),
        })
      : null
  const failedMessage = result?.status === 'failed' ? result.message : null
  const shown = clientIssues ?? serverIssues
  const errors = shown?.errors ?? noErrors
  const summary = shown?.summary ?? []
  const hasProblem = summary.length > 0 || failedMessage !== null

  // Move focus to the error summary after each failed attempt or reply.
  useEffect(() => {
    summaryRef.current?.focus()
  }, [attempt, actionData])

  useEffect(() => {
    pendingFocus.current?.()
    pendingFocus.current = null
  })

  function setField(
    field: 'title' | 'servings' | 'prepTimeMinutes' | 'cookTimeMinutes',
    value: string,
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  // --- Ingredients ---

  function changeIngredient(
    key: string,
    field: IngredientField,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      ingredients: current.ingredients.map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      ),
    }))
  }

  function addIngredient() {
    const row = emptyIngredient()
    setValues((current) => ({
      ...current,
      ingredients: [...current.ingredients, row],
    }))
    pendingFocus.current = () => focusById(ids.ingredient(row.key, 'quantity'))
  }

  function removeIngredient(key: string) {
    setValues((current) => ({
      ...current,
      ingredients: current.ingredients.filter((row) => row.key !== key),
    }))
    pendingFocus.current = () => focusById('add-ingredient')
  }

  // --- Steps ---

  function changeStep(key: string, text: string) {
    setValues((current) => ({
      ...current,
      steps: current.steps.map((row) =>
        row.key === key ? { ...row, text } : row,
      ),
    }))
  }

  function addStep() {
    const row = emptyStep()
    setValues((current) => ({ ...current, steps: [...current.steps, row] }))
    pendingFocus.current = () => focusById(ids.step(row.key))
  }

  function removeStep(key: string) {
    setValues((current) => ({
      ...current,
      steps: current.steps.filter((row) => row.key !== key),
    }))
    pendingFocus.current = () => focusById('add-step')
  }

  function moveStep(key: string, direction: 'up' | 'down') {
    const count = values.steps.length
    const index = values.steps.findIndex((row) => row.key === key)
    const target = direction === 'up' ? index - 1 : index + 1
    if (index === -1 || target < 0 || target >= count) return

    // Swap inside the updater, so two quick activations do not use old state.
    setValues((current) => {
      const from = current.steps.findIndex((row) => row.key === key)
      const to = direction === 'up' ? from - 1 : from + 1
      if (from === -1 || to < 0 || to >= current.steps.length) return current
      const steps = [...current.steps]
      ;[steps[from], steps[to]] = [steps[to], steps[from]]
      return { ...current, steps }
    })
    // The count flips an invisible character so an identical message is read again.
    setAnnouncement((current) => ({
      text: `Stap ${index + 1} is verplaatst naar positie ${target + 1} van ${count}.`,
      count: current.count + 1,
    }))
    // The moved step keeps focus on the same button, or on the other one when
    // it reached the top or the bottom and that button is now disabled.
    pendingFocus.current = () => {
      const same = document.getElementById(`step-${key}-${direction}`)
      const other = document.getElementById(
        `step-${key}-${direction === 'up' ? 'down' : 'up'}`,
      )
      const preferred = same instanceof HTMLButtonElement && !same.disabled
      ;(preferred ? same : other)?.focus()
    }
  }

  // --- Tags ---

  function commitTag() {
    const result = addTag(values.tags, values.tagInput)
    if (!result.ok) {
      setTagError(result.message)
      return
    }
    setTagError(null)
    setValues((current) => ({ ...current, tags: result.tags, tagInput: '' }))
  }

  function removeTag(tag: string) {
    setValues((current) => ({
      ...current,
      tags: current.tags.filter((existing) => existing !== tag),
    }))
    setTagError(null)
    pendingFocus.current = () => focusById(ids.tagInput)
  }

  // --- Submit ---

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setDismissed(actionData)

    // Text typed in the tag field but not added yet still counts.
    const tagResult = addTag(values.tags, values.tagInput)
    if (!tagResult.ok) {
      setTagError(tagResult.message)
      setClientIssues({
        errors: noErrors,
        summary: [{ id: ids.tagInput, message: tagResult.message }],
      })
      setAttempt((count) => count + 1)
      return
    }
    setTagError(null)
    const next = { ...values, tags: tagResult.tags, tagInput: '' }
    setValues(next)

    const outcome = validate(next)
    if (!outcome.ok) {
      setClientIssues({ errors: outcome.errors, summary: outcome.summary })
      setAttempt((count) => count + 1)
      return
    }
    setClientIssues(null)
    setSubmittedKeys(outcome.keys)
    submit(
      { payload: outcome.payload },
      { method: 'post', encType: 'application/json' },
    )
  }

  const backTo = recipe ? `/recepten/${recipe.id}` : '/'

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <title>
        {recipe
          ? `${recipe.title} bewerken · Recipe Vault`
          : 'Nieuw recept · Recipe Vault'}
      </title>
      <Link to={backTo} className={styles.back}>
        <span aria-hidden="true">←</span>{' '}
        {recipe ? 'Terug naar recept' : 'Alle recepten'}
      </Link>
      <h1 className={styles.heading}>
        {recipe ? 'Recept bewerken' : 'Nieuw recept'}
      </h1>

      {hasProblem && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="group"
          aria-labelledby="form-problems"
          className={styles.summary}
        >
          <h2 id="form-problems" className={styles.summaryTitle}>
            {failedMessage
              ? 'Opslaan is niet gelukt'
              : 'Controleer het formulier'}
          </h2>
          {failedMessage ? (
            <p>{failedMessage}</p>
          ) : (
            <ul className={styles.summaryList}>
              {summary.map((item, index) => (
                <li key={`${item.id}-${index}`}>
                  <a
                    href={`#${item.id}`}
                    onClick={(event) => {
                      event.preventDefault()
                      focusById(item.id)
                    }}
                  >
                    {item.message}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <TextField
        id={ids.title}
        label="Titel"
        value={values.title}
        error={errors.title}
        onChange={(value) => setField('title', value)}
      />
      <TextField
        id={ids.servings}
        label="Aantal personen"
        inputMode="numeric"
        value={values.servings}
        error={errors.servings}
        onChange={(value) => setField('servings', value)}
      />
      <div className={`${styles.pair} ${styles.pairWide}`}>
        <TextField
          id={ids.prep}
          label="Voorbereiding (min, optioneel)"
          inputMode="numeric"
          value={values.prepTimeMinutes}
          error={errors.prepTimeMinutes}
          onChange={(value) => setField('prepTimeMinutes', value)}
        />
        <TextField
          id={ids.cook}
          label="Kooktijd (min, optioneel)"
          inputMode="numeric"
          value={values.cookTimeMinutes}
          error={errors.cookTimeMinutes}
          onChange={(value) => setField('cookTimeMinutes', value)}
        />
      </div>

      <IngredientsField
        rows={values.ingredients}
        errors={errors.ingredients}
        listError={errors.ingredientsList}
        onChange={changeIngredient}
        onAdd={addIngredient}
        onRemove={removeIngredient}
      />
      <StepsField
        rows={values.steps}
        errors={errors.steps}
        listError={errors.stepsList}
        onChange={changeStep}
        onAdd={addStep}
        onRemove={removeStep}
        onMove={moveStep}
      />
      <TagsField
        tags={values.tags}
        input={values.tagInput}
        error={tagError}
        onInputChange={(value) => {
          setValues((current) => ({ ...current, tagInput: value }))
          setTagError(null)
        }}
        onAdd={commitTag}
        onRemove={removeTag}
      />

      <p role="status" className={styles.visuallyHidden}>
        {announcement.text}
        {announcement.count % 2 === 1 ? '\u200b' : ''}
      </p>

      <div className={styles.actions}>
        <button type="submit" className={buttons.primary} disabled={submitting}>
          {submitting ? 'Opslaan…' : 'Opslaan'}
        </button>
        <Link to={backTo} className={buttons.secondary}>
          Annuleren
        </Link>
      </div>
    </form>
  )
}

export default RecipeForm
