import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { makeTestApp } from '../testing.ts'
import type { TestApp } from '../testing.ts'

const recipes = [
  {
    title: 'Stoofvlees',
    servings: 4,
    prepTimeMinutes: 30,
    cookTimeMinutes: 180,
    ingredients: [
      { name: 'rundsvlees', quantity: 800, unit: 'g', note: 'in blokken' },
      { name: 'een snufje zout' },
    ],
    steps: ['Een', 'Twee', 'Drie'],
    tags: ['hoofdgerecht', 'Belgisch'],
  },
  { title: 'Crêpes', servings: 2, tags: ['dessert'] },
]

describe('export and import', () => {
  let a: TestApp
  let b: TestApp
  beforeEach(() => {
    a = makeTestApp()
    b = makeTestApp()
  })
  afterEach(async () => {
    await a.cleanup()
    await b.cleanup()
  })

  const create = (t: TestApp, payload: object) =>
    t.app
      .inject({ method: 'POST', url: '/api/recipes', payload })
      .then((r) => r.json())
  const exportFile = (t: TestApp) => t.app.inject({ url: '/api/export' })
  const importFile = (t: TestApp, payload: unknown) =>
    t.app.inject({
      method: 'POST',
      url: '/api/import',
      payload: payload as object,
    })
  const count = (t: TestApp) =>
    t.db.prepare('SELECT COUNT(*) FROM recipe').pluck().get() as number

  it('exports active recipes only, with a schema version and no ids', async () => {
    for (const r of recipes) await create(a, r)
    const gone = await create(a, { title: 'Weg', servings: 1 })
    await a.app.inject({ method: 'DELETE', url: `/api/recipes/${gone.id}` })

    const response = await exportFile(a)
    assert.equal(response.statusCode, 200)
    assert.match(
      response.headers['content-disposition'] as string,
      /attachment; filename="recipe-vault-\d{4}-\d{2}-\d{2}\.json"/,
    )
    const file = response.json()
    assert.equal(file.schemaVersion, 1)
    assert.ok(file.exportedAt)
    assert.deepEqual(
      file.recipes.map((r: { title: string }) => r.title),
      ['Crêpes', 'Stoofvlees'],
    )
    for (const r of file.recipes) {
      for (const key of ['id', 'createdAt', 'updatedAt', 'deletedAt']) {
        assert.equal(key in r, false, key)
      }
    }
  })

  it('exports an empty collection', async () => {
    assert.deepEqual((await exportFile(a)).json().recipes, [])
  })

  it('round-trips into another instance with order and content intact', async () => {
    for (const r of recipes) await create(a, r)
    const file = (await exportFile(a)).json()

    const response = await importFile(b, file)
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.json(), { added: 2 })
    assert.deepEqual((await exportFile(b)).json().recipes, file.recipes)
  })

  it('makes imported recipes searchable', async () => {
    await importFile(
      b,
      (
        await (async () => {
          await create(a, recipes[1]!)
          return exportFile(a)
        })()
      ).json(),
    )
    const { items } = (
      await b.app.inject({ url: '/api/recipes?q=crepes' })
    ).json()
    assert.equal(items.length, 1)
  })

  it('adds as new and never overwrites or deletes existing recipes', async () => {
    const existing = await create(b, recipes[0]!)
    await create(a, recipes[0]!)
    const file = (await exportFile(a)).json()

    assert.deepEqual((await importFile(b, file)).json(), { added: 1 })
    assert.equal(count(b), 2, 'duplicate title is allowed')
    const unchanged = (
      await b.app.inject({ url: `/api/recipes/${existing.id}` })
    ).json()
    assert.deepEqual(unchanged, existing)
  })

  it('rejects an unsupported schema version and changes nothing', async () => {
    const response = await importFile(b, {
      schemaVersion: 2,
      recipes: [{ title: 'x', servings: 1 }],
      future: true,
    })
    assert.equal(response.statusCode, 422)
    assert.equal(response.json().error.code, 'unsupported_schema_version')
    assert.equal(count(b), 0)
  })

  it('rejects invalid content with paths and imports none of it', async () => {
    const response = await importFile(b, {
      schemaVersion: 1,
      recipes: [
        { title: 'Goed', servings: 2 },
        { title: '', servings: 2, ingredients: [{ quantity: 1 }] },
        'geen object',
      ],
    })
    assert.equal(response.statusCode, 400)
    const body = response.json()
    assert.equal(body.error.code, 'validation_failed')
    assert.deepEqual(body.error.fields, [
      { path: 'recipes[1].title', code: 'required' },
      { path: 'recipes[1].ingredients[0].name', code: 'required' },
      { path: 'recipes[2]', code: 'wrong_type' },
    ])
    assert.equal(count(b), 0, 'all or nothing')
  })

  it('rejects files with missing or unknown parts', async () => {
    const cases: [unknown, { path: string; code: string }[]][] = [
      [[], [{ path: '', code: 'wrong_type' }]],
      [{ recipes: [] }, [{ path: 'schemaVersion', code: 'required' }]],
      [
        { schemaVersion: 'een' },
        [{ path: 'schemaVersion', code: 'wrong_type' }],
      ],
      [{ schemaVersion: 1 }, [{ path: 'recipes', code: 'required' }]],
      [
        { schemaVersion: 1, recipes: {} },
        [{ path: 'recipes', code: 'wrong_type' }],
      ],
      [
        { schemaVersion: 1, recipes: [], extra: 1 },
        [{ path: 'extra', code: 'unknown_field' }],
      ],
    ]
    for (const [payload, fields] of cases) {
      const response = await importFile(b, payload)
      assert.equal(response.statusCode, 400, JSON.stringify(payload))
      assert.deepEqual(
        response.json().error.fields,
        fields,
        JSON.stringify(payload),
      )
    }
  })

  it('accepts an empty import and reports zero added', async () => {
    const response = await importFile(b, { schemaVersion: 1, recipes: [] })
    assert.deepEqual(response.json(), { added: 0 })
  })

  it('rejects an import body above the limit', async () => {
    const big = {
      schemaVersion: 1,
      recipes: [],
      padding: 'x'.repeat(5 * 1024 * 1024 + 10),
    }
    const response = await importFile(b, big)
    assert.equal(response.statusCode, 413)
    assert.equal(response.json().error.code, 'payload_too_large')
  })
})
