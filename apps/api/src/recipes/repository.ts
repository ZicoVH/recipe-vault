import type { Database } from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import {
  reindexRecipe,
  removeFromIndex,
  searchTerms,
  toMatchQuery,
} from './search.ts'
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
    reindexRecipe(db, id)
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
    reindexRecipe(db, id)
  })()
  return { status: 'ok', recipe: getRecipe(db, id) as Recipe }
}

export type RecipeFilter = {
  /** Free text: every word must start a word in the title, an ingredient or a tag. */
  q?: string
  /** Every tag must be on the recipe (AND), compared ignoring case. */
  tags?: string[]
}

/** Active recipes that match the filter, sorted by title ignoring case and accents. */
export function listRecipes(
  db: Database,
  filter: RecipeFilter = {},
): RecipeSummary[] {
  const terms = filter.q ? searchTerms(filter.q) : []
  const rows = (
    terms.length > 0
      ? db
          .prepare(
            `SELECT r.* FROM recipe_fts f JOIN recipe r ON r.id = f.recipe_id
             WHERE recipe_fts MATCH ? AND r.deleted_at IS NULL`,
          )
          .all(toMatchQuery(terms))
      : db.prepare(`SELECT * FROM recipe WHERE deleted_at IS NULL`).all()
  ) as RecipeRow[]
  const tagRows = db
    .prepare(`SELECT recipe_id, name FROM tag ORDER BY recipe_id, position`)
    .all() as { recipe_id: string; name: string }[]
  const tagsByRecipe = new Map<string, string[]>()
  for (const { recipe_id, name } of tagRows) {
    const list = tagsByRecipe.get(recipe_id)
    if (list) list.push(name)
    else tagsByRecipe.set(recipe_id, [name])
  }
  const wanted = (filter.tags ?? [])
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
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
    .filter((recipe) => {
      const have = recipe.tags.map((tag) => tag.toLowerCase())
      return wanted.every((tag) => have.includes(tag))
    })
    .sort((a, b) => collator.compare(a.title, b.title))
}

export type TagCount = { name: string; count: number }

/**
 * Tags used by active recipes with their counts. Tags are grouped ignoring case
 * with the same rule as the tag filter and the validator (toLowerCase).
 */
export function listTags(db: Database): TagCount[] {
  const names = db
    .prepare(
      `SELECT t.name FROM tag t JOIN recipe r ON r.id = t.recipe_id
       WHERE r.deleted_at IS NULL`,
    )
    .pluck()
    .all() as string[]
  const groups = new Map<string, TagCount>()
  for (const name of names) {
    const key = name.toLowerCase()
    const group = groups.get(key)
    if (!group) groups.set(key, { name, count: 1 })
    else {
      group.count++
      if (name < group.name) group.name = name
    }
  }
  return [...groups.values()].sort((a, b) => collator.compare(a.name, b.name))
}

/** Moves a recipe to the trash. Repeating it keeps the first deletion time. */
export function trashRecipe(db: Database, id: string): 'ok' | 'not_found' {
  const result = db
    .prepare(
      `UPDATE recipe SET deleted_at = COALESCE(deleted_at, ?) WHERE id = ?`,
    )
    .run(new Date().toISOString(), id)
  return result.changes === 0 ? 'not_found' : 'ok'
}

/** Trashed recipes, most recently deleted first. */
export function listTrash(db: Database): RecipeSummary[] {
  const rows = db
    .prepare(
      `SELECT * FROM recipe WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
    )
    .all() as RecipeRow[]
  const tags = db.prepare(
    `SELECT name FROM tag WHERE recipe_id = ? ORDER BY position`,
  )
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    servings: row.servings,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    tags: tags.pluck().all(row.id) as string[],
    deletedAt: row.deleted_at,
  }))
}

export type TrashActionResult<T = undefined> =
  | { status: 'ok'; value: T }
  | { status: 'not_found' }
  | { status: 'not_in_trash' }

function trashState(db: Database, id: string) {
  const row = db
    .prepare(`SELECT deleted_at FROM recipe WHERE id = ?`)
    .get(id) as { deleted_at: string | null } | undefined
  if (!row) return 'not_found' as const
  return row.deleted_at === null
    ? ('not_in_trash' as const)
    : ('trashed' as const)
}

export function restoreRecipe(
  db: Database,
  id: string,
): TrashActionResult<Recipe> {
  const state = trashState(db, id)
  if (state !== 'trashed') return { status: state }
  db.prepare(`UPDATE recipe SET deleted_at = NULL WHERE id = ?`).run(id)
  return { status: 'ok', value: getRecipe(db, id) as Recipe }
}

/** Permanently deletes a recipe. Only recipes in the trash can be removed. */
export function deleteTrashedRecipe(
  db: Database,
  id: string,
): TrashActionResult {
  const state = trashState(db, id)
  if (state !== 'trashed') return { status: state }
  removeFromIndex(db, id)
  db.prepare(`DELETE FROM recipe WHERE id = ?`).run(id)
  return { status: 'ok', value: undefined }
}
