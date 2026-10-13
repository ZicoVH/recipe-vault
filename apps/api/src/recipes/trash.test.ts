import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { makeTestApp } from '../testing.ts'
import type { TestApp } from '../testing.ts'

const recipe = {
  title: 'Stoofvlees',
  servings: 4,
  prepTimeMinutes: 30,
  ingredients: [
    { name: 'rundsvlees', quantity: 800, unit: 'g' },
    { name: 'zout' },
  ],
  steps: ['Een', 'Twee'],
  tags: ['hoofdgerecht'],
}

describe('trash routes', () => {
  let t: TestApp
  beforeEach(() => {
    t = makeTestApp()
  })
  afterEach(async () => {
    await t.cleanup()
  })

  const create = async (body: object = recipe) =>
    (
      await t.app.inject({ method: 'POST', url: '/api/recipes', payload: body })
    ).json()
  const trash = (id: string) =>
    t.app.inject({ method: 'DELETE', url: `/api/recipes/${id}` })
  const get = (url: string) => t.app.inject({ url }).then((r) => r.json())

  it('moves a recipe to the trash and out of the list and tags', async () => {
    const { id } = await create()
    assert.equal((await trash(id)).statusCode, 204)

    assert.deepEqual((await get('/api/recipes')).items, [])
    assert.deepEqual((await get('/api/tags')).items, [])
    const trashed = (await get('/api/trash')).items
    assert.equal(trashed.length, 1)
    assert.equal(trashed[0].id, id)
    assert.ok(trashed[0].deletedAt)
  })

  it('keeps the recipe readable by id, with its deletedAt set', async () => {
    const { id } = await create()
    await trash(id)
    const read = await get(`/api/recipes/${id}`)
    assert.equal(read.title, 'Stoofvlees')
    assert.ok(read.deletedAt)
  })

  it('is safe to repeat and keeps the first deletion time', async () => {
    const { id } = await create()
    await trash(id)
    const first = (await get(`/api/recipes/${id}`)).deletedAt
    await new Promise((resolve) => setTimeout(resolve, 5))
    assert.equal((await trash(id)).statusCode, 204)
    assert.equal((await get(`/api/recipes/${id}`)).deletedAt, first)
  })

  it('returns 404 when trashing an unknown recipe', async () => {
    assert.equal((await trash('nope')).statusCode, 404)
  })

  it('restores a recipe with all data intact', async () => {
    const created = await create()
    await trash(created.id)
    const response = await t.app.inject({
      method: 'POST',
      url: `/api/trash/${created.id}/restore`,
    })
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.json(), created)
    assert.equal((await get('/api/recipes')).items.length, 1)
    assert.deepEqual((await get('/api/trash')).items, [])
  })

  it('refuses to restore a recipe that is not in the trash', async () => {
    const { id } = await create()
    const response = await t.app.inject({
      method: 'POST',
      url: `/api/trash/${id}/restore`,
    })
    assert.equal(response.statusCode, 409)
    assert.equal(response.json().error.code, 'not_in_trash')
    const unknown = await t.app.inject({
      method: 'POST',
      url: '/api/trash/nope/restore',
    })
    assert.equal(unknown.statusCode, 404)
  })

  it('deletes permanently only from the trash, including all child rows', async () => {
    const { id } = await create()
    const active = await t.app.inject({
      method: 'DELETE',
      url: `/api/trash/${id}`,
    })
    assert.equal(active.statusCode, 409)
    assert.equal(active.json().error.code, 'not_in_trash')

    await trash(id)
    const removed = await t.app.inject({
      method: 'DELETE',
      url: `/api/trash/${id}`,
    })
    assert.equal(removed.statusCode, 204)
    assert.equal(
      (await t.app.inject({ url: `/api/recipes/${id}` })).statusCode,
      404,
    )
    for (const table of ['recipe', 'ingredient', 'step', 'tag']) {
      assert.equal(
        t.db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get(),
        0,
        table,
      )
    }
    const again = await t.app.inject({
      method: 'DELETE',
      url: `/api/trash/${id}`,
    })
    assert.equal(again.statusCode, 404)
  })

  it('lists the trash with the most recently deleted first', async () => {
    const a = await create({ ...recipe, title: 'A' })
    const b = await create({ ...recipe, title: 'B', tags: [] })
    await trash(a.id)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await trash(b.id)
    const titles = (await get('/api/trash')).items.map(
      (r: { title: string }) => r.title,
    )
    assert.deepEqual(titles, ['B', 'A'])
  })
})
