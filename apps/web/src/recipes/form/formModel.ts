import type { Recipe, RecipeInput } from '../types'

// Limits mirror docs/api-model.md. The API enforces them too, so keep both in sync.
export const LIMITS = {
  titleMax: 200,
  servingsMax: 1000,
  minutesMax: 14400,
  ingredientsMax: 100,
  quantityMax: 1_000_000,
  ingredientNameMax: 200,
  unitMax: 50,
  noteMax: 200,
  stepsMax: 100,
  stepMax: 5000,
  tagsMax: 30,
  tagMax: 50,
}

export type IngredientRow = {
  key: string
  quantity: string
  unit: string
  name: string
  note: string
}

export type StepRow = { key: string; text: string }

/** Everything the user typed, as text. Converted to numbers on submit. */
export type FormValues = {
  title: string
  servings: string
  prepTimeMinutes: string
  cookTimeMinutes: string
  ingredients: IngredientRow[]
  steps: StepRow[]
  tags: string[]
  tagInput: string
}

export type IngredientField = 'quantity' | 'unit' | 'name' | 'note'

export type FieldErrors = {
  title?: string
  servings?: string
  prepTimeMinutes?: string
  cookTimeMinutes?: string
  ingredients: Record<string, Partial<Record<IngredientField, string>>>
  steps: Record<string, string>
  ingredientsList?: string
  stepsList?: string
}

export type SummaryItem = { id: string; message: string }

/** The rows that made it into the request, to map server errors back to rows. */
export type SubmittedKeys = { ingredients: string[]; steps: string[] }

export type ValidationOutcome =
  | { ok: true; payload: RecipeInput; keys: SubmittedKeys }
  | { ok: false; errors: FieldErrors; summary: SummaryItem[] }

/** DOM ids, so error summary links can focus the right input. */
export const ids = {
  title: 'recipe-title',
  servings: 'recipe-servings',
  prep: 'recipe-prep',
  cook: 'recipe-cook',
  tagInput: 'recipe-tag-input',
  ingredient: (key: string, field: IngredientField) =>
    `ingredient-${key}-${field}`,
  step: (key: string) => `step-${key}-text`,
}

// A counter, not crypto.randomUUID: that is missing on http origins (such as
// a Raspberry Pi on the local network).
let counter = 0
const newKey = () => `r${++counter}`

export const emptyIngredient = (): IngredientRow => ({
  key: newKey(),
  quantity: '',
  unit: '',
  name: '',
  note: '',
})

export const emptyStep = (): StepRow => ({ key: newKey(), text: '' })

const decimalFormat = (value: number) => String(value).replace('.', ',')

export function initialValues(recipe: Recipe | null): FormValues {
  if (!recipe) {
    return {
      title: '',
      servings: '4',
      prepTimeMinutes: '',
      cookTimeMinutes: '',
      ingredients: [emptyIngredient()],
      steps: [emptyStep()],
      tags: [],
      tagInput: '',
    }
  }
  return {
    title: recipe.title,
    servings: String(recipe.servings),
    prepTimeMinutes:
      recipe.prepTimeMinutes === null ? '' : String(recipe.prepTimeMinutes),
    cookTimeMinutes:
      recipe.cookTimeMinutes === null ? '' : String(recipe.cookTimeMinutes),
    ingredients:
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((ingredient) => ({
            key: newKey(),
            quantity:
              ingredient.quantity === null
                ? ''
                : decimalFormat(ingredient.quantity),
            unit: ingredient.unit ?? '',
            name: ingredient.name,
            note: ingredient.note ?? '',
          }))
        : [emptyIngredient()],
    steps:
      recipe.steps.length > 0
        ? recipe.steps.map((text) => ({ key: newKey(), text }))
        : [emptyStep()],
    tags: recipe.tags,
    tagInput: '',
  }
}

// --- Tags ---

export type AddTagResult =
  { ok: true; tags: string[] } | { ok: false; message: string }

/** Adds a tag: trimmed, and not twice ignoring case (D13). */
export function addTag(tags: string[], input: string): AddTagResult {
  const tag = input.trim()
  if (tag === '') return { ok: true, tags }
  if (tag.length > LIMITS.tagMax) {
    return {
      ok: false,
      message: `Een tag mag maximaal ${LIMITS.tagMax} tekens bevatten.`,
    }
  }
  if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
    return { ok: false, message: `De tag ‘${tag}’ staat er al.` }
  }
  if (tags.length >= LIMITS.tagsMax) {
    return {
      ok: false,
      message: `Een recept kan maximaal ${LIMITS.tagsMax} tags hebben.`,
    }
  }
  return { ok: true, tags: [...tags, tag] }
}

// --- Validation ---

function parseWholeNumber(text: string): number | null {
  return /^\d+$/.test(text) ? Number(text) : null
}

/** Accepts a decimal point or comma: "2,5" and "2.5". */
function parseDecimal(text: string): number | null {
  return /^\d+([.,]\d+)?$/.test(text) ? Number(text.replace(',', '.')) : null
}

/**
 * "1.000" is a thousand in Dutch but 1 as a decimal number, so it is refused
 * instead of guessed. A leading zero ("0.125") is clearly a decimal.
 */
function looksLikeThousands(text: string): boolean {
  return /^[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(text)
}

export function validate(values: FormValues): ValidationOutcome {
  const errors: FieldErrors = { ingredients: {}, steps: {} }
  const summary: SummaryItem[] = []

  function report(id: string, message: string, summaryMessage = message) {
    summary.push({ id, message: summaryMessage })
    return message
  }

  const title = values.title.trim()
  if (title === '') {
    errors.title = report(ids.title, 'Vul een titel in.')
  } else if (title.length > LIMITS.titleMax) {
    errors.title = report(
      ids.title,
      `De titel mag maximaal ${LIMITS.titleMax} tekens bevatten.`,
    )
  }

  let servings: number | null = null
  const servingsText = values.servings.trim()
  if (servingsText === '') {
    errors.servings = report(ids.servings, 'Vul het aantal personen in.')
  } else {
    servings = parseWholeNumber(servingsText)
    if (servings === null || servings < 1 || servings > LIMITS.servingsMax) {
      servings = null
      errors.servings = report(
        ids.servings,
        `Vul een geheel getal in van 1 tot ${LIMITS.servingsMax}.`,
      )
    }
  }

  function minutes(
    text: string,
    field: 'prepTimeMinutes' | 'cookTimeMinutes',
    id: string,
  ): number | null {
    const trimmed = text.trim()
    if (trimmed === '') return null
    const value = parseWholeNumber(trimmed)
    if (value === null || value < 1 || value > LIMITS.minutesMax) {
      errors[field] = report(
        id,
        `Vul een geheel aantal minuten in van 1 tot ${LIMITS.minutesMax}, of laat het leeg.`,
      )
      return null
    }
    return value
  }
  const prepTimeMinutes = minutes(
    values.prepTimeMinutes,
    'prepTimeMinutes',
    ids.prep,
  )
  const cookTimeMinutes = minutes(
    values.cookTimeMinutes,
    'cookTimeMinutes',
    ids.cook,
  )

  // Rows without any text are ignored, so an empty starter row is harmless.
  const ingredients: RecipeInput['ingredients'] = []
  const ingredientKeys: string[] = []
  values.ingredients.forEach((row, index) => {
    const quantityText = row.quantity.trim()
    const unit = row.unit.trim()
    const name = row.name.trim()
    const note = row.note.trim()
    if (!quantityText && !unit && !name && !note) return

    const label = `Ingrediënt ${index + 1}`
    const rowErrors: Partial<Record<IngredientField, string>> = {}
    if (name === '') {
      rowErrors.name = report(
        ids.ingredient(row.key, 'name'),
        'Vul de naam van het ingrediënt in.',
        `${label}: vul de naam in.`,
      )
    } else if (name.length > LIMITS.ingredientNameMax) {
      rowErrors.name = report(
        ids.ingredient(row.key, 'name'),
        `De naam mag maximaal ${LIMITS.ingredientNameMax} tekens bevatten.`,
        `${label}: de naam is te lang.`,
      )
    }

    let quantity: number | null = null
    if (quantityText !== '') {
      quantity = parseDecimal(quantityText)
      if (looksLikeThousands(quantityText)) {
        quantity = null
        rowErrors.quantity = report(
          ids.ingredient(row.key, 'quantity'),
          'Schrijf duizendtallen zonder punt en gebruik een komma voor decimalen, bijvoorbeeld 1000 of 2,5.',
          `${label}: de hoeveelheid is dubbelzinnig, gebruik een komma voor decimalen.`,
        )
      } else if (
        quantity === null ||
        quantity <= 0 ||
        quantity > LIMITS.quantityMax
      ) {
        quantity = null
        rowErrors.quantity = report(
          ids.ingredient(row.key, 'quantity'),
          'Vul een getal groter dan 0 in, bijvoorbeeld 250 of 2,5.',
          `${label}: de hoeveelheid is geen geldig getal.`,
        )
      }
    }
    if (unit.length > LIMITS.unitMax) {
      rowErrors.unit = report(
        ids.ingredient(row.key, 'unit'),
        `De eenheid mag maximaal ${LIMITS.unitMax} tekens bevatten.`,
        `${label}: de eenheid is te lang.`,
      )
    }
    if (note.length > LIMITS.noteMax) {
      rowErrors.note = report(
        ids.ingredient(row.key, 'note'),
        `De opmerking mag maximaal ${LIMITS.noteMax} tekens bevatten.`,
        `${label}: de opmerking is te lang.`,
      )
    }

    if (Object.keys(rowErrors).length > 0) {
      errors.ingredients[row.key] = rowErrors
      return
    }
    ingredientKeys.push(row.key)
    ingredients.push({
      name,
      quantity,
      unit: unit || null,
      note: note || null,
    })
  })

  const steps: string[] = []
  const stepKeys: string[] = []
  values.steps.forEach((row, index) => {
    const text = row.text.trim()
    if (text === '') return
    if (text.length > LIMITS.stepMax) {
      errors.steps[row.key] = report(
        ids.step(row.key),
        `Een stap mag maximaal ${LIMITS.stepMax} tekens bevatten.`,
        `Stap ${index + 1}: de tekst is te lang.`,
      )
      return
    }
    stepKeys.push(row.key)
    steps.push(text)
  })

  if (ingredients.length > LIMITS.ingredientsMax) {
    errors.ingredientsList = report(
      'add-ingredient',
      `Een recept kan maximaal ${LIMITS.ingredientsMax} ingrediënten hebben.`,
    )
  }
  if (steps.length > LIMITS.stepsMax) {
    errors.stepsList = report(
      'add-step',
      `Een recept kan maximaal ${LIMITS.stepsMax} stappen hebben.`,
    )
  }

  if (summary.length > 0 || servings === null) {
    return { ok: false, errors, summary }
  }
  return {
    ok: true,
    payload: {
      title,
      servings,
      prepTimeMinutes,
      cookTimeMinutes,
      ingredients,
      steps,
      tags: values.tags,
    },
    keys: { ingredients: ingredientKeys, steps: stepKeys },
  }
}

// --- Errors reported by the API ---

export type ServerFieldError = { path: string; code: string }

const SERVER_MESSAGES: Record<string, string> = {
  required: 'Dit veld is verplicht.',
  too_long: 'Deze tekst is te lang.',
  too_short: 'Deze tekst is te kort.',
  out_of_range: 'Deze waarde ligt buiten het toegestane bereik.',
  not_integer: 'Vul een geheel getal in.',
  wrong_type: 'Deze waarde is niet geldig.',
  unknown_field: 'Dit veld hoort niet bij een recept.',
}
export const serverMessage = (code: string) =>
  SERVER_MESSAGES[code] ?? 'Deze waarde is niet geldig.'

/**
 * Maps API field errors back to the form. The API reports positions in the
 * request, which skips blank rows, so `keys` translates them to row keys.
 * Row numbers in the messages come from `current`, the rows on screen now.
 */
/** "Stap 3: ", or nothing when the row is no longer on screen. */
function rowLabel(name: string, rows: string[], key: string): string {
  const index = rows.indexOf(key)
  return index === -1 ? '' : `${name} ${index + 1}: `
}

export function mapServerErrors(
  fields: ServerFieldError[],
  keys: SubmittedKeys,
  current: SubmittedKeys,
): { errors: FieldErrors; summary: SummaryItem[] } {
  const errors: FieldErrors = { ingredients: {}, steps: {} }
  const summary: SummaryItem[] = []

  for (const { path, code } of fields) {
    const message = serverMessage(code)
    const ingredient = /^ingredients\[(\d+)\]\.(\w+)$/.exec(path)
    const step = /^steps\[(\d+)\]$/.exec(path)
    if (ingredient && keys.ingredients[Number(ingredient[1])] !== undefined) {
      const key = keys.ingredients[Number(ingredient[1])]
      const field = ingredient[2] as IngredientField
      errors.ingredients[key] = { ...errors.ingredients[key], [field]: message }
      summary.push({
        id: ids.ingredient(key, field),
        message: `${rowLabel('Ingrediënt', current.ingredients, key)}${message}`,
      })
    } else if (step && keys.steps[Number(step[1])] !== undefined) {
      const key = keys.steps[Number(step[1])]
      errors.steps[key] = message
      summary.push({
        id: ids.step(key),
        message: `${rowLabel('Stap', current.steps, key)}${message}`,
      })
    } else if (path === 'title') {
      errors.title = message
      summary.push({ id: ids.title, message: `Titel: ${message}` })
    } else if (path === 'servings') {
      errors.servings = message
      summary.push({ id: ids.servings, message: `Personen: ${message}` })
    } else if (path === 'prepTimeMinutes') {
      errors.prepTimeMinutes = message
      summary.push({ id: ids.prep, message: `Voorbereiding: ${message}` })
    } else if (path === 'cookTimeMinutes') {
      errors.cookTimeMinutes = message
      summary.push({ id: ids.cook, message: `Kooktijd: ${message}` })
    } else {
      summary.push({
        id: ids.title,
        message: `Het recept is niet geldig: ${message}`,
      })
    }
  }
  return { errors, summary }
}
