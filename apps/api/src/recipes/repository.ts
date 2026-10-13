import type { Database } from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import type { Ingredient, Recipe, RecipeInput, RecipeSummary } from './types.ts'

type RecipeRow = {
  id: string
  title: string
  servings: number
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

const collator = new Intl.Collator('nl', { sensitivity: 'base' })

function writeChildren(db: Database, id: string, input: RecipeInput) {
  const addIngredient = db.prepare(
    `INSERT INTO ingredient (recipe_id, position, name, quantity, unit, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
  input.ingredients.forEach((item, position) => {
    addIngredient.run(
      id,
      position,
      item.name,
      item.quantity,
      item.unit,
      item.note,
    )
  })
  const addStep = db.prepare(
    `INSERT INTO step (recipe_id, position, text) VALUES (?, ?, ?)`,
  )
  input.steps.forEach((text, position) => addStep.run(id, position, text))
  const addTag = db.prepare(
    `INSERT INTO tag (recipe_id, position, name) VALUES (?, ?, ?)`,
  )
  input.tags.forEach((name, position) => addTag.run(id, position, name))
}

export function createRecipe(db: Database, input: RecipeInput): Recipe {
  const id = randomUUID()
  const now = new Date().toISOString()
  db.transaction(() => {
    db.prepare(
      `INSERT INTO recipe
         (id, title, servings, prep_time_minutes, cook_time_minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.title,
      input.servings,
      input.prepTimeMinutes,
      input.cookTimeMinutes,
      now,
      now,
    )
    writeChildren(db, id, input)
  })()
  return getRecipe(db, id) as Recipe
}

export function getRecipe(db: Database, id: string): Recipe | undefined {
  const row = db.prepare(`SELECT * FROM recipe WHERE id = ?`).get(id) as
    RecipeRow | undefined
  if (!row) return undefined
  const ingredients = db
    .prepare(
      `SELECT name, quantity, unit, note FROM ingredient
       WHERE recipe_id = ? ORDER BY position`,
    )
    .all(id) as Ingredient[]
  const steps = db
    .prepare(`SELECT text FROM step WHERE recipe_id = ? ORDER BY position`)
    .pluck()
    .all(id) as string[]
  const tags = db
    .prepare(`SELECT name FROM tag WHERE recipe_id = ? ORDER BY position`)
    .pluck()
    .all(id) as string[]
  return {
    id: row.id,
    title: row.title,
    servings: row.servings,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    ingredients,
    steps,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}

export type UpdateResult =
  | { status: 'ok'; recipe: Recipe }
  | { status: 'not_found' }
  | { status: 'trashed' }

/** Replaces all editable fields. A trashed recipe cannot be edited. */
export function updateRecipe(
  db: Database,
  id: string,
  input: RecipeInput,
): UpdateResult {
  const existing = db
    .prepare(`SELECT deleted_at FROM recipe WHERE id = ?`)
    .get(id) as { deleted_at: string | null } | undefined
  if (!existing) return { status: 'not_found' }
  if (existing.deleted_at !== null) return { status: 'trashed' }

  db.transaction(() => {
    db.prepare(
      `UPDATE recipe SET title = ?, servings = ?, prep_time_minutes = ?,
         cook_time_minutes = ?, updated_at = ? WHERE id = ?`,
    ).run(
      input.title,
      input.servings,
      input.prepTimeMinutes,
      input.cookTimeMinutes,
      new Date().toISOString(),
      id,
    )
    db.prepare(`DELETE FROM ingredient WHERE recipe_id = ?`).run(id)
    db.prepare(`DELETE FROM step WHERE recipe_id = ?`).run(id)
    db.prepare(`DELETE FROM tag WHERE recipe_id = ?`).run(id)
    writeChildren(db, id, input)
  })()
  return { status: 'ok', recipe: getRecipe(db, id) as Recipe }
}

/** Active recipes, sorted by title ignoring case and accents. */
export function listRecipes(db: Database): RecipeSummary[] {
  const rows = db
    .prepare(`SELECT * FROM recipe WHERE deleted_at IS NULL`)
    .all() as RecipeRow[]
  const tagRows = db
    .prepare(`SELECT recipe_id, name FROM tag ORDER BY recipe_id, position`)
    .all() as { recipe_id: string; name: string }[]
  const tagsByRecipe = new Map<string, string[]>()
  for (const { recipe_id, name } of tagRows) {
    const list = tagsByRecipe.get(recipe_id)
    if (list) list.push(name)
    else tagsByRecipe.set(recipe_id, [name])
  }
  return rows
    .map((row) => ({
      id: row.id,
      title: row.title,
      servings: row.servings,
      prepTimeMinutes: row.prep_time_minutes,
      cookTimeMinutes: row.cook_time_minutes,
      tags: tagsByRecipe.get(row.id) ?? [],
      deletedAt: row.deleted_at,
    }))
    .sort((a, b) => collator.compare(a.title, b.title))
}
