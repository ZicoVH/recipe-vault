// Pre-spike runner for docs/spike-pi-sqlite.md. Covers checks 2, 3 and 4
// (logic only) and records informational RAM and latency figures.
// Throwaway code, not part of the app.
// Usage: node run.mjs [dataDir]   (default: a fresh temp dir)

import Database from 'better-sqlite3'
import { createHash } from 'node:crypto'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generate } from './seed.mjs'

const dir = process.argv[2] ?? mkdtempSync(join(tmpdir(), 'rv-spike-'))
mkdirSync(dir, { recursive: true })
const dbPath = join(dir, 'live.db')
const backupPath = join(dir, 'backup.db')
const restoredPath = join(dir, 'restored.db')
for (const f of [
  dbPath,
  `${dbPath}-wal`,
  `${dbPath}-shm`,
  backupPath,
  restoredPath,
]) {
  if (existsSync(f)) rmSync(f)
}

const results = []
const record = (check, name, pass, detail = '') => {
  results.push({ check, name, pass, detail })
  console.log(
    `${pass ? 'PASS' : 'FAIL'}  [${check}] ${name}${detail ? ` - ${detail}` : ''}`,
  )
}
const ms = (t0) => Math.round(performance.now() - t0)
const mb = (n) => Math.round(n / 1024 / 1024)

function open(path) {
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  return db
}

function init(db) {
  db.exec(`
    CREATE TABLE recipe (id INTEGER PRIMARY KEY, title TEXT NOT NULL, servings INTEGER NOT NULL, trashed INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE ingredient (recipe_id INTEGER NOT NULL, name TEXT NOT NULL);
    CREATE TABLE tag (recipe_id INTEGER NOT NULL, name TEXT NOT NULL);
    CREATE TABLE step (recipe_id INTEGER NOT NULL, position INTEGER NOT NULL, text TEXT NOT NULL);
    CREATE VIRTUAL TABLE recipe_fts USING fts5(title, ingredients, tags, tokenize = 'unicode61 remove_diacritics 2');
  `)
}

function insertRecipe(db, r) {
  const { lastInsertRowid: id } = db
    .prepare('INSERT INTO recipe (title, servings, trashed) VALUES (?, ?, ?)')
    .run(r.title, r.servings, r.trashed ? 1 : 0)
  r.ingredients.forEach((n) =>
    db.prepare('INSERT INTO ingredient VALUES (?, ?)').run(id, n),
  )
  r.tags.forEach((n) => db.prepare('INSERT INTO tag VALUES (?, ?)').run(id, n))
  r.steps.forEach((t, i) =>
    db.prepare('INSERT INTO step VALUES (?, ?, ?)').run(id, i, t),
  )
  db.prepare(
    'INSERT INTO recipe_fts (rowid, title, ingredients, tags) VALUES (?, ?, ?, ?)',
  ).run(id, r.title, r.ingredients.join(' '), r.tags.join(' '))
  return id
}

function search(db, query) {
  const terms = query
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
  if (terms.length === 0) return []
  const match = terms.map((t) => `"${t}"*`).join(' ')
  return db
    .prepare(
      `SELECT r.title FROM recipe_fts f JOIN recipe r ON r.id = f.rowid
       WHERE recipe_fts MATCH ? AND r.trashed = 0 ORDER BY r.title`,
    )
    .all(match)
    .map((row) => row.title)
}

function fingerprint(db) {
  const rows = db
    .prepare(
      `SELECT r.id, r.title, r.servings, r.trashed,
        (SELECT group_concat(name, '|') FROM ingredient WHERE recipe_id = r.id) AS ing,
        (SELECT group_concat(name, '|') FROM tag WHERE recipe_id = r.id) AS tags
       FROM recipe r ORDER BY r.id`,
    )
    .all()
  return {
    count: rows.length,
    hash: createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
  }
}

console.log(
  `Node ${process.version}, SQLite ${new Database(':memory:').prepare('select sqlite_version() v').get().v}, dir ${dir}`,
)

// Seed
const recipes = generate(500)
let db = open(dbPath)
init(db)
const t0 = performance.now()
db.transaction(() => recipes.forEach((r) => insertRecipe(db, r)))()
console.log(`Seeded ${recipes.length} recipes in ${ms(t0)} ms`)

// Check 2: FTS5 and accent-insensitive search
const only = (q, expected) => {
  const got = search(db, q)
  const ok =
    got.length === expected.length && expected.every((e) => got.includes(e))
  record(
    2,
    `search "${q}"`,
    ok,
    ok
      ? ''
      : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(got.slice(0, 5))}`,
  )
}
only('creme brulee', ['Crème brûlée'])
only('CREME BRULEE', ['Crème brûlée'])
only('crêpes', ['Crêpes'])
only('CREPES', ['Crêpes'])
only('saumon', ['Saumon à l’oseille'])
only('SAUMON OSEILLE', ['Saumon à l’oseille'])
only('oseille', ['Saumon à l’oseille']) // ingredient name
only('mosterd', ['Stoofvlees met friet']) // ingredient name
only('poisson', ['Saumon à l’oseille']) // tag
only('zzzzgeenresultaat', [])
record(
  2,
  'trashed recipe excluded',
  !search(db, 'oud').includes('Crème brûlée (oud)'),
)

// Latency (informational on this machine, same process, no network)
const queries = [
  'creme',
  'stoof',
  'wortel',
  'dessert',
  'oignon',
  'kaas',
  'saumon',
  'pancakes',
]
const times = []
for (let i = 0; i < 400; i++) {
  const t = performance.now()
  search(db, queries[i % queries.length])
  times.push(performance.now() - t)
}
times.sort((a, b) => a - b)
const p95 = times[Math.floor(times.length * 0.95)]
console.log(
  `INFO  search p95 ${p95.toFixed(2)} ms over ${times.length} queries (in-process, not the Pi)`,
)

// Check 3: online backup while writing, integrity check, restore
// Keep the writer busy and copy only a few pages per step, so many writes
// land while the backup is in progress.
let writes = 0
let writing = true
const writeLoop = () => {
  if (!writing) return
  insertRecipe(db, {
    title: `Schrijftest ${writes}`,
    servings: 2,
    ingredients: ['ui'],
    tags: [],
    steps: ['x'],
    trashed: false,
  })
  writes++
  setImmediate(writeLoop)
}
setImmediate(writeLoop)
const tb = performance.now()
let backupSteps = 0
await db.backup(backupPath, {
  progress: () => {
    backupSteps++
    return 2
  },
})
const backupMs = ms(tb)
writing = false
const backupDb = new Database(backupPath, { readonly: true })
const integrity = backupDb.pragma('integrity_check', { simple: true })
const backupFp = fingerprint(backupDb)
backupDb.close()
record(
  3,
  'backup taken while writing',
  writes >= 10 && backupSteps > 5,
  `${backupMs} ms, ${backupSteps} steps, ${writes} concurrent writes, ${(statSync(backupPath).size / 1024 / 1024).toFixed(1)} MB`,
)
record(3, 'backup integrity_check', integrity === 'ok', String(integrity))

db.close()
// Full restore: wipe live data, copy backup into place, verify.
for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`])
  if (existsSync(f)) rmSync(f)
const tr = performance.now()
copyFileSync(backupPath, restoredPath)
db = open(restoredPath)
const restoreMs = ms(tr)
const restoredFp = fingerprint(db)
record(
  3,
  'restore matches backup',
  restoredFp.hash === backupFp.hash && restoredFp.count === backupFp.count,
  `${restoredFp.count} recipes, restore ${restoreMs} ms`,
)
record(
  3,
  'restored search works',
  search(db, 'creme brulee').includes('Crème brûlée'),
)

// Check 4 (logic only): WAL on, data survives close and reopen
record(
  4,
  'WAL mode enabled',
  db.pragma('journal_mode', { simple: true }) === 'wal',
)
db.close()
db = open(restoredPath)
const reopenFp = fingerprint(db)
record(4, 'data survives reopen', reopenFp.hash === restoredFp.hash)
record(
  4,
  'integrity_check after reopen',
  db.pragma('integrity_check', { simple: true }) === 'ok',
)
db.close()

const rss = process.memoryUsage().rss
console.log(`INFO  process RSS ${mb(rss)} MB (this machine, not the Pi)`)

const failed = results.filter((r) => !r.pass)
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed`,
)
process.exit(failed.length ? 1 : 0)
