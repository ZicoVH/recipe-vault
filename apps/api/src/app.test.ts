import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { buildApp } from './app.ts'
import { openDatabase } from './db.ts'

describe('GET /api/health', () => {
  it('returns ok while the database is open', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rv-api-'))
    const db = openDatabase(dir)
    const app = buildApp({ db })
    const response = await app.inject({ method: 'GET', url: '/api/health' })
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.json(), { status: 'ok' })
    await app.close()
    db.close()
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns 503 when the database is closed', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rv-api-'))
    const db = openDatabase(dir)
    const app = buildApp({ db })
    db.close()
    const response = await app.inject({ method: 'GET', url: '/api/health' })
    assert.equal(response.statusCode, 503)
    assert.deepEqual(response.json(), { status: 'unavailable' })
    await app.close()
    rmSync(dir, { recursive: true, force: true })
  })
})
