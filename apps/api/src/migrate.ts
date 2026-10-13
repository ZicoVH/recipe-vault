import type { Database } from 'better-sqlite3'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations/', import.meta.url))

/**
 * Applies the numbered `NNNN_name.sql` files in the migrations folder that the
 * database has not seen yet. The applied count is kept in `PRAGMA user_version`.
 * Each migration runs in its own transaction, so a failure leaves the database
 * at the last good version. Returns the resulting schema version.
 */
export function migrate(db: Database, dir: string = MIGRATIONS_DIR): number {
  const files = readdirSync(dir)
    .filter((name) => /^\d{4}_.+\.sql$/.test(name))
    .sort()

  const current = db.pragma('user_version', { simple: true }) as number
  if (current > files.length) {
    throw new Error(
      `Database schema version ${current} is newer than this app knows (${files.length}).`,
    )
  }

  for (const [index, name] of files.entries()) {
    const version = index + 1
    if (version <= current) continue
    const sql = readFileSync(`${dir}/${name}`, 'utf8')
    db.transaction(() => {
      db.exec(sql)
      db.pragma(`user_version = ${version}`)
    })()
  }
  return files.length
}
