import Database from 'better-sqlite3'
import type { Database as Db } from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { migrate } from './migrate.ts'

export const DB_FILE = 'recipes.db'

/**
 * Opens (and creates, if needed) the SQLite database inside `dataDir`, turns
 * on WAL mode and foreign keys, and applies pending migrations. `dataDir` is
 * the persistent volume in production.
 */
export function openDatabase(dataDir: string): Db {
  mkdirSync(dataDir, { recursive: true })
  const db = new Database(join(dataDir, DB_FILE))
  try {
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    migrate(db)
    db.prepare(
      `INSERT OR IGNORE INTO app_info (key, value) VALUES ('created_at', ?)`,
    ).run(new Date().toISOString())
  } catch (error) {
    db.close()
    throw error
  }
  return db
}
