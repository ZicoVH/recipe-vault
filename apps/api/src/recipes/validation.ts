import type { FieldError, Ingredient, RecipeInput } from './types.ts'

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

export type ValidationResult =
  { ok: true; value: RecipeInput } | { ok: false; fields: FieldError[] }

const RECIPE_FIELDS = [
  'title',
  'servings',
  'prepTimeMinutes',
  'cookTimeMinutes',
  'ingredients',
  'steps',
  'tags',
]
const INGREDIENT_FIELDS = ['name', 'quantity', 'unit', 'note']

type Errors = FieldError[]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function rejectUnknown(
  obj: Record<string, unknown>,
  allowed: string[],
  prefix: string,
  errors: Errors,
) {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      errors.push({ path: prefix + key, code: 'unknown_field' })
    }
  }
}

/** A required string, trimmed. Returns undefined when invalid. */
function requiredText(
  value: unknown,
  path: string,
  max: number,
  errors: Errors,
): string | undefined {
  if (value === undefined || value === null) {
    errors.push({ path, code: 'required' })
    return undefined
  }
  if (typeof value !== 'string') {
    errors.push({ path, code: 'wrong_type' })
    return undefined
  }
  const text = value.trim()
  if (text === '') {
    errors.push({ path, code: 'required' })
    return undefined
  }
  if (text.length > max) {
    errors.push({ path, code: 'too_long' })
    return undefined
  }
  return text
}

/** An optional string, trimmed. Missing, null and blank all become null. */
function optionalText(
  value: unknown,
  path: string,
  max: number,
  errors: Errors,
): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') {
    errors.push({ path, code: 'wrong_type' })
    return null
  }
  const text = value.trim()
  if (text === '') return null
  if (text.length > max) {
    errors.push({ path, code: 'too_long' })
    return null
  }
  return text
}

function wholeNumber(
  value: unknown,
  path: string,
  min: number,
  max: number,
  errors: Errors,
): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push({ path, code: 'wrong_type' })
    return undefined
  }
  if (!Number.isInteger(value)) {
    errors.push({ path, code: 'not_integer' })
    return undefined
  }
  if (value < min || value > max) {
    errors.push({ path, code: 'out_of_range' })
    return undefined
  }
  return value
}

function optionalMinutes(
  value: unknown,
  path: string,
  errors: Errors,
): number | null {
  if (value === undefined || value === null) return null
  return wholeNumber(value, path, 1, LIMITS.minutesMax, errors) ?? null
}

function validateIngredient(
  value: unknown,
  path: string,
  errors: Errors,
): Ingredient | undefined {
  if (!isRecord(value)) {
    errors.push({ path, code: 'wrong_type' })
    return undefined
  }
  rejectUnknown(value, INGREDIENT_FIELDS, `${path}.`, errors)
  const name = requiredText(
    value.name,
    `${path}.name`,
    LIMITS.ingredientNameMax,
    errors,
  )

  let quantity: number | null = null
  if (value.quantity !== undefined && value.quantity !== null) {
    if (
      typeof value.quantity !== 'number' ||
      !Number.isFinite(value.quantity)
    ) {
      errors.push({ path: `${path}.quantity`, code: 'wrong_type' })
    } else if (value.quantity <= 0 || value.quantity > LIMITS.quantityMax) {
      errors.push({ path: `${path}.quantity`, code: 'out_of_range' })
    } else {
      quantity = value.quantity
    }
  }

  const unit = optionalText(value.unit, `${path}.unit`, LIMITS.unitMax, errors)
  const note = optionalText(value.note, `${path}.note`, LIMITS.noteMax, errors)
  return name === undefined ? undefined : { name, quantity, unit, note }
}

/** Trims tags, drops empty ones and collapses duplicates ignoring case (D13). */
function validateTags(value: unknown, errors: Errors): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    errors.push({ path: 'tags', code: 'wrong_type' })
    return []
  }
  if (value.length > LIMITS.tagsMax) {
    errors.push({ path: 'tags', code: 'too_long' })
    return []
  }
  const seen = new Set<string>()
  const tags: string[] = []
  value.forEach((item, index) => {
    const path = `tags[${index}]`
    if (typeof item !== 'string') {
      errors.push({ path, code: 'wrong_type' })
      return
    }
    const tag = item.trim()
    if (tag === '') return
    if (tag.length > LIMITS.tagMax) {
      errors.push({ path, code: 'too_long' })
      return
    }
    const key = tag.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    tags.push(tag)
  })
  return tags
}

export function validateRecipeInput(body: unknown): ValidationResult {
  const errors: Errors = []
  if (!isRecord(body)) {
    return { ok: false, fields: [{ path: '', code: 'wrong_type' }] }
  }
  rejectUnknown(body, RECIPE_FIELDS, '', errors)

  const title = requiredText(body.title, 'title', LIMITS.titleMax, errors)

  let servings: number | undefined
  if (body.servings === undefined || body.servings === null) {
    errors.push({ path: 'servings', code: 'required' })
  } else {
    servings = wholeNumber(
      body.servings,
      'servings',
      1,
      LIMITS.servingsMax,
      errors,
    )
  }

  const prepTimeMinutes = optionalMinutes(
    body.prepTimeMinutes,
    'prepTimeMinutes',
    errors,
  )
  const cookTimeMinutes = optionalMinutes(
    body.cookTimeMinutes,
    'cookTimeMinutes',
    errors,
  )

  const ingredients: Ingredient[] = []
  if (body.ingredients !== undefined && body.ingredients !== null) {
    if (!Array.isArray(body.ingredients)) {
      errors.push({ path: 'ingredients', code: 'wrong_type' })
    } else if (body.ingredients.length > LIMITS.ingredientsMax) {
      errors.push({ path: 'ingredients', code: 'too_long' })
    } else {
      body.ingredients.forEach((item, index) => {
        const ingredient = validateIngredient(
          item,
          `ingredients[${index}]`,
          errors,
        )
        if (ingredient) ingredients.push(ingredient)
      })
    }
  }

  const steps: string[] = []
  if (body.steps !== undefined && body.steps !== null) {
    if (!Array.isArray(body.steps)) {
      errors.push({ path: 'steps', code: 'wrong_type' })
    } else if (body.steps.length > LIMITS.stepsMax) {
      errors.push({ path: 'steps', code: 'too_long' })
    } else {
      body.steps.forEach((item, index) => {
        const step = requiredText(
          item,
          `steps[${index}]`,
          LIMITS.stepMax,
          errors,
        )
        if (step !== undefined) steps.push(step)
      })
    }
  }

  const tags = validateTags(body.tags, errors)

  if (errors.length > 0 || title === undefined || servings === undefined) {
    return { ok: false, fields: errors }
  }
  return {
    ok: true,
    value: {
      title,
      servings,
      prepTimeMinutes,
      cookTimeMinutes,
      ingredients,
      steps,
      tags,
    },
  }
}
