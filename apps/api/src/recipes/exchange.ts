import type { Database } from 'better-sqlite3'
import { createRecipe, getRecipe, listRecipes } from './repository.ts'
import type { FieldError, RecipeInput } from './types.ts'
import { validateRecipeInput } from './validation.ts'

export const SCHEMA_VERSION = 1
const MAX_REPORTED_ERRORS = 50
export const MAX_IMPORT_RECIPES = 5000

export type ExportFile = {
  schemaVersion: number
  exportedAt: string
  recipes: RecipeInput[]
}

/** All active recipes without ids, timestamps or trash state (US7). */
export function exportRecipes(db: Database): ExportFile {
  const recipes = listRecipes(db).map((summary): RecipeInput => {
    const recipe = getRecipe(db, summary.id)!
    return {
      title: recipe.title,
      servings: recipe.servings,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tags: recipe.tags,
    }
  })
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    recipes,
  }
}

export type ImportResult =
  | { status: 'ok'; added: number }
  | { status: 'unsupported_schema_version' }
  | { status: 'invalid'; fields: FieldError[] }

/**
 * Adds every recipe of an export file as a new recipe (D11). The whole file is
 * validated first and written in one transaction, so a problem changes nothing.
 */
export function importRecipes(db: Database, body: unknown): ImportResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { status: 'invalid', fields: [{ path: '', code: 'wrong_type' }] }
  }
  const file = body as Record<string, unknown>

  if (file.schemaVersion === undefined) {
    return {
      status: 'invalid',
      fields: [{ path: 'schemaVersion', code: 'required' }],
    }
  }
  if (!Number.isInteger(file.schemaVersion)) {
    return {
      status: 'invalid',
      fields: [{ path: 'schemaVersion', code: 'wrong_type' }],
    }
  }
  if (file.schemaVersion !== SCHEMA_VERSION) {
    return { status: 'unsupported_schema_version' }
  }

  const errors: FieldError[] = []
  for (const key of Object.keys(file)) {
    if (!['schemaVersion', 'exportedAt', 'recipes'].includes(key)) {
      errors.push({ path: key, code: 'unknown_field' })
    }
  }
  if (file.exportedAt !== undefined && typeof file.exportedAt !== 'string') {
    errors.push({ path: 'exportedAt', code: 'wrong_type' })
  }
  if (file.recipes === undefined) {
    errors.push({ path: 'recipes', code: 'required' })
  } else if (!Array.isArray(file.recipes)) {
    errors.push({ path: 'recipes', code: 'wrong_type' })
  }
  if (Array.isArray(file.recipes) && file.recipes.length > MAX_IMPORT_RECIPES) {
    errors.push({ path: 'recipes', code: 'too_long' })
  }
  if (errors.length > 0) return { status: 'invalid', fields: errors }

  const inputs: RecipeInput[] = []
  ;(file.recipes as unknown[]).forEach((item, index) => {
    const result = validateRecipeInput(item)
    if (result.ok) {
      inputs.push(result.value)
      return
    }
    for (const field of result.fields) {
      const base = `recipes[${index}]`
      errors.push({
        path: field.path ? `${base}.${field.path}` : base,
        code: field.code,
      })
    }
  })
  if (errors.length > 0) {
    return { status: 'invalid', fields: errors.slice(0, MAX_REPORTED_ERRORS) }
  }

  db.transaction(() => {
    for (const input of inputs) createRecipe(db, input)
  })()
  return { status: 'ok', added: inputs.length }
}
