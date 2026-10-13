import type { Database } from 'better-sqlite3'

// The FTS tokenizer removes accents but does not expand ligatures, so both the
// indexed text and the query go through the same folding.
const FOLDS: Record<string, string> = {
  œ: 'oe',
  Œ: 'oe',
  æ: 'ae',
  Æ: 'ae',
  ß: 'ss',
  ø: 'o',
  Ø: 'o',
}

/** NFC-normalizes (so "e" + accent equals "é") and expands ligatures. */
export function fold(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[œŒæÆßøØ]/g, (char) => FOLDS[char] ?? char)
}

/** Splits a search text into word terms the way the tokenizer does. */
export function searchTerms(text: string): string[] {
  return fold(text)
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter(Boolean)
}

/** Every term must match the start of a word (AND). Terms hold only letters, marks and digits. */
export function toMatchQuery(terms: string[]): string {
  return terms.map((term) => `"${term}"*`).join(' ')
}

/** Rebuilds the index row of one recipe from its current data. */
export function reindexRecipe(db: Database, id: string) {
  const title = db
    .prepare(`SELECT title FROM recipe WHERE id = ?`)
    .pluck()
    .get(id) as string | undefined
  if (title === undefined) return
  const names = (table: 'ingredient' | 'tag') =>
    (
      db
        .prepare(
          `SELECT name FROM ${table} WHERE recipe_id = ? ORDER BY position`,
        )
        .pluck()
        .all(id) as string[]
    ).join(' ')
  removeFromIndex(db, id)
  db.prepare(
    `INSERT INTO recipe_fts (recipe_id, title, ingredients, tags) VALUES (?, ?, ?, ?)`,
  ).run(id, fold(title), fold(names('ingredient')), fold(names('tag')))
}

export function removeFromIndex(db: Database, id: string) {
  db.prepare(`DELETE FROM recipe_fts WHERE recipe_id = ?`).run(id)
}
