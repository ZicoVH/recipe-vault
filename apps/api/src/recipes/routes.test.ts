import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { openDatabase } from '../db.ts'
import { makeTestApp } from '../testing.ts'
import type { TestApp } from '../testing.ts'

const stoofvlees = {
  title: 'Stoofvlees',
  servings: 4,
  prepTimeMinutes: 30,
  cookTimeMinutes: 180,
  ingredients: [
    { name: 'rundsvlees', quantity: 800, unit: 'g', note: 'in blokken' },
    { name: 'zout en peper' },
    { name: 'bier', quantity: 33, unit: 'cl' },
  ],
  steps: ['Kruid het vlees.', 'Bruin het vlees.', 'Laat sudderen.'],
  tags: ['Hoofdgerecht', 'belgisch'],
}

describe('recipe routes', () => {
  let t: TestApp
  beforeEach(() => {
    t = makeTestApp()
  })
  afterEach(async () => {
    await t.cleanup()
  })

  const post = (payload: unknown) =>
    t.app.inject({
      method: 'POST',
      url: '/api/recipes',
      payload: payload as object,
    })
  const count = () =>
    t.db.prepare('SELECT COUNT(*) FROM recipe').pluck().get() as number

  it('creates a recipe and returns it with server-owned fields', async () => {
    const response = await post(stoofvlees)
    assert.equal(response.statusCode, 201)
    const recipe = response.json()
    assert.match(recipe.id, /^[0-9a-f-]{36}$/)
    assert.equal(recipe.deletedAt, null)
    assert.equal(recipe.createdAt, recipe.updatedAt)
    assert.equal(recipe.title, 'Stoofvlees')
    assert.equal(recipe.prepTimeMinutes, 30)
  })

  it('keeps ingredient and step order and fills optional ingredient fields', async () => {
    const { id } = (await post(stoofvlees)).json()
    const recipe = (await t.app.inject({ url: `/api/recipes/${id}` })).json()
    assert.deepEqual(
      recipe.ingredients.map((i: { name: string }) => i.name),
      ['rundsvlees', 'zout en peper', 'bier'],
    )
    assert.deepEqual(recipe.ingredients[1], {
      name: 'zout en peper',
      quantity: null,
      unit: null,
      note: null,
    })
    assert.deepEqual(recipe.steps, [
      'Kruid het vlees.',
      'Bruin het vlees.',
      'Laat sudderen.',
    ])
    assert.deepEqual(recipe.tags, ['Hoofdgerecht', 'belgisch'])
  })

  it('creates a recipe with only title and servings', async () => {
    const response = await post({ title: 'Toast', servings: 1 })
    assert.equal(response.statusCode, 201)
    const recipe = response.json()
    assert.equal(recipe.prepTimeMinutes, null)
    assert.deepEqual(recipe.ingredients, [])
    assert.deepEqual(recipe.steps, [])
  })

  it('rejects invalid input with field errors and saves nothing', async () => {
    const response = await post({
      title: '',
      servings: 0,
      ingredients: [{ quantity: 1 }],
    })
    assert.equal(response.statusCode, 400)
    const body = response.json()
    assert.equal(body.error.code, 'validation_failed')
    assert.deepEqual(body.error.fields, [
      { path: 'title', code: 'required' },
      { path: 'servings', code: 'out_of_range' },
      { path: 'ingredients[0].name', code: 'required' },
    ])
    assert.equal(count(), 0)
  })

  it('rejects malformed JSON with invalid_json', async () => {
    const response = await t.app.inject({
      method: 'POST',
      url: '/api/recipes',
      headers: { 'content-type': 'application/json' },
      payload: '{"title": ',
    })
    assert.equal(response.statusCode, 400)
    assert.equal(response.json().error.code, 'invalid_json')
  })

  it('dedupes tags ignoring case', async () => {
    const response = await post({
      title: 'T',
      servings: 1,
      tags: ['Winter', ' winter ', 'Snel'],
    })
    assert.deepEqual(response.json().tags, ['Winter', 'Snel'])
  })

  it('returns 404 for an unknown recipe and unknown routes', async () => {
    const missing = await t.app.inject({ url: '/api/recipes/nope' })
    assert.equal(missing.statusCode, 404)
    assert.equal(missing.json().error.code, 'not_found')
    const unknown = await t.app.inject({ url: '/api/unknown' })
    assert.equal(unknown.statusCode, 404)
    assert.equal(unknown.json().error.code, 'not_found')
  })

  it('replaces all fields on update and persists them', async () => {
    const { id } = (await post(stoofvlees)).json()
    const response = await t.app.inject({
      method: 'PUT',
      url: `/api/recipes/${id}`,
      payload: { title: 'Stoofvlees v2', servings: 6, steps: ['Alleen dit.'] },
    })
    assert.equal(response.statusCode, 200)
    const updated = response.json()
    assert.equal(updated.id, id)
    assert.equal(updated.title, 'Stoofvlees v2')
    assert.equal(updated.prepTimeMinutes, null)
    assert.deepEqual(updated.ingredients, [])
    assert.deepEqual(updated.tags, [])
    assert.ok(updated.updatedAt >= updated.createdAt)

    // Persisted: a fresh connection to the same file sees the change.
    t.db.close()
    const reopened = openDatabase(t.dir)
    const title = reopened
      .prepare('SELECT title FROM recipe WHERE id = ?')
      .pluck()
      .get(id)
    reopened.close()
    assert.equal(title, 'Stoofvlees v2')
  })

  it('does not change a recipe when an update is invalid', async () => {
    const { id } = (await post(stoofvlees)).json()
    const response = await t.app.inject({
      method: 'PUT',
      url: `/api/recipes/${id}`,
      payload: { title: 'Kapot', servings: -1 },
    })
    assert.equal(response.statusCode, 400)
    const recipe = (await t.app.inject({ url: `/api/recipes/${id}` })).json()
    assert.equal(recipe.title, 'Stoofvlees')
    assert.equal(recipe.ingredients.length, 3)
  })

  it('returns 404 when updating an unknown recipe', async () => {
    const response = await t.app.inject({
      method: 'PUT',
      url: '/api/recipes/nope',
      payload: { title: 'x', servings: 1 },
    })
    assert.equal(response.statusCode, 404)
  })

  it('refuses to update a trashed recipe', async () => {
    const { id } = (await post(stoofvlees)).json()
    t.db
      .prepare('UPDATE recipe SET deleted_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id)
    const response = await t.app.inject({
      method: 'PUT',
      url: `/api/recipes/${id}`,
      payload: { title: 'x', servings: 1 },
    })
    assert.equal(response.statusCode, 409)
    assert.equal(response.json().error.code, 'recipe_trashed')
  })

  it('lists active recipes sorted by title ignoring case and accents', async () => {
    for (const title of ['zuurkool', 'Éclair', 'appeltaart', 'Crêpes']) {
      await post({ title, servings: 2, tags: ['t'] })
    }
    const { id } = (await post({ title: 'Weg', servings: 1 })).json()
    t.db
      .prepare('UPDATE recipe SET deleted_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id)

    const { items } = (await t.app.inject({ url: '/api/recipes' })).json()
    assert.deepEqual(
      items.map((r: { title: string }) => r.title),
      ['appeltaart', 'Crêpes', 'Éclair', 'zuurkool'],
    )
    assert.deepEqual(items[0].tags, ['t'])
    assert.equal(
      items[0].ingredients,
      undefined,
      'summaries have no ingredients',
    )
  })
})
