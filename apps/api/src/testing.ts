// Helpers for tests. Not part of the production build.
import type { Database } from 'better-sqlite3'
import type { FastifyInstance } from 'fastify'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildApp } from './app.ts'
import { openDatabase } from './db.ts'

export type TestApp = {
  app: FastifyInstance
  db: Database
  dir: string
  cleanup: () => Promise<void>
}

export function makeTestApp(): TestApp {
  const dir = mkdtempSync(join(tmpdir(), 'rv-api-'))
  const db = openDatabase(dir)
  const app = buildApp({ db })
  return {
    app,
    db,
    dir,
    cleanup: async () => {
      await app.close()
      if (db.open) db.close()
      rmSync(dir, { recursive: true, force: true })
    },
  }
}
