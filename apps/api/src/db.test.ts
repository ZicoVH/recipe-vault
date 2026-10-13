import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { openDatabase } from './db.ts'

describe('openDatabase', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'rv-api-'))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('creates the data directory, enables WAL and applies migrations', () => {
    const nested = join(dir, 'does', 'not', 'exist')
    const db = openDatabase(nested)
    assert.equal(db.pragma('journal_mode', { simple: true }), 'wal')
    assert.equal(db.pragma('foreign_keys', { simple: true }), 1)
    assert.ok((db.pragma('user_version', { simple: true }) as number) >= 1)
    db.close()
  })

  it('keeps its data across a close and reopen', () => {
    const first = openDatabase(dir)
    first
      .prepare(`INSERT INTO app_info (key, value) VALUES ('probe', 'kept')`)
      .run()
    const createdAt = first
      .prepare(`SELECT value FROM app_info WHERE key = 'created_at'`)
      .pluck()
      .get()
    first.close()

    const second = openDatabase(dir)
    const read = (key: string) =>
      second
        .prepare(`SELECT value FROM app_info WHERE key = ?`)
        .pluck()
        .get(key)
    assert.equal(read('probe'), 'kept')
    assert.equal(read('created_at'), createdAt, 'created_at is not overwritten')
    assert.equal(second.pragma('integrity_check', { simple: true }), 'ok')
    second.close()
  })

  it('does not reapply migrations on reopen', () => {
    const first = openDatabase(dir)
    const version = first.pragma('user_version', { simple: true })
    first.close()
    const second = openDatabase(dir)
    assert.equal(second.pragma('user_version', { simple: true }), version)
    second.close()
  })
})
