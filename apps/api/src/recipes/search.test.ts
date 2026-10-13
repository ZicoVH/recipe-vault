import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { makeTestApp } from '../testing.ts'
import type { TestApp } from '../testing.ts'
import { fold, searchTerms } from './search.ts'

describe('searchTerms', () => {
  it('splits on punctuation and folds ligatures', () => {
    assert.deepEqual(searchTerms(`  l'oseille, crème! `), [
      'l',
      'oseille',
      'crème',
    ])
    assert.deepEqual(searchTerms('Œufs ß'), ['oeufs', 'ss'])
    assert.deepEqual(searchTerms('!!! ??'), [])
    assert.equal(fold('Cœur'), 'Coeur')
  })
})

describe('search routes', () => {
  let t: TestApp
  beforeEach(async () => {
    t = makeTestApp()
    const seed = [
      {
        title: 'Crème brûlée',
        ingredients: [{ name: 'crème' }, { name: 'vanille' }],
        tags: ['Dessert'],
      },
      {
        title: 'Crêpes',
        ingredients: [{ name: 'farine' }, { name: 'œufs' }],
        tags: ['dessert', 'Snel'],
      },
      {
        title: 'Saumon à l’oseille',
        ingredients: [{ name: 'saumon' }, { name: 'oseille' }],
        tags: ['poisson'],
      },
      {
        title: 'Stoofvlees',
        ingredients: [{ name: 'rundsvlees' }, { name: 'mosterd' }],
        tags: ['hoofdgerecht', 'Été'],
      },
      { title: 'Soep', ingredients: [{ name: 'prei' }], tags: ['été', 'snel'] },
    ]
    for (const r of seed) {
      await t.app.inject({
        method: 'POST',
        url: '/api/recipes',
        payload: { ...r, servings: 2 },
      })
    }
  })
  afterEach(async () => {
    await t.cleanup()
  })

  const search = async (query: string) => {
    const response = await t.app.inject({ url: `/api/recipes?${query}` })
    assert.equal(response.statusCode, 200)
    return response
      .json()
      .items.map((r: { title: string }) => r.title) as string[]
  }

  it('returns all active recipes without a query', async () => {
    assert.equal((await search('')).length, 5)
    assert.equal((await search('q=')).length, 5)
    assert.equal((await search('q=%20%21%21')).length, 5, 'punctuation only')
  })

  it('ignores case and accents', async () => {
    assert.deepEqual(await search('q=creme%20brulee'), ['Crème brûlée'])
    assert.deepEqual(await search('q=CREME%20BRULEE'), ['Crème brûlée'])
    assert.deepEqual(await search('q=CREPES'), ['Crêpes'])
    assert.deepEqual(await search('q=cr%C3%AApes'), ['Crêpes'])
    assert.deepEqual(await search('q=saumon'), ['Saumon à l’oseille'])
  })

  it('finds recipes by ingredient name and by tag', async () => {
    assert.deepEqual(await search('q=mosterd'), ['Stoofvlees'])
    assert.deepEqual(await search('q=poisson'), ['Saumon à l’oseille'])
  })

  it('matches word starts and requires every term (AND)', async () => {
    assert.deepEqual(await search('q=stoof'), ['Stoofvlees'])
    assert.deepEqual(await search('q=vlees'), [], 'not a word start')
    assert.deepEqual(
      await search('q=saumon%20vanille'),
      [],
      'terms in different recipes',
    )
    assert.deepEqual(await search('q=cr%C3%A8me%20vanille'), ['Crème brûlée'])
    assert.deepEqual(await search('q=l%27oseille'), ['Saumon à l’oseille'])
  })

  it('finds ligatures through their expansion', async () => {
    assert.deepEqual(await search('q=oeufs'), ['Crêpes'])
    assert.deepEqual(await search('q=%C5%93ufs'), ['Crêpes'])
  })

  it('returns an empty list when nothing matches', async () => {
    assert.deepEqual(await search('q=zzzgeenresultaat'), [])
  })

  it('filters by tags with AND, ignoring case and accents in case only', async () => {
    assert.deepEqual(await search('tag=dessert'), ['Crème brûlée', 'Crêpes'])
    assert.deepEqual(await search('tag=DESSERT&tag=snel'), ['Crêpes'])
    assert.deepEqual(await search('tag=dessert&tag=poisson'), [])
    assert.deepEqual(await search('tag=%C3%A9T%C3%89'), ['Soep', 'Stoofvlees'])
  })

  it('combines text and tags', async () => {
    assert.deepEqual(await search('q=cr&tag=snel'), ['Crêpes'])
    assert.deepEqual(await search('q=soep&tag=dessert'), [])
  })

  it('excludes trashed recipes and finds them again after restore', async () => {
    const [{ id }] = (
      await t.app.inject({ url: '/api/recipes?q=crepes' })
    ).json().items
    await t.app.inject({ method: 'DELETE', url: `/api/recipes/${id}` })
    assert.deepEqual(await search('q=crepes'), [])
    await t.app.inject({ method: 'POST', url: `/api/trash/${id}/restore` })
    assert.deepEqual(await search('q=crepes'), ['Crêpes'])
  })

  it('keeps the index in sync on update and permanent delete', async () => {
    const [{ id }] = (await t.app.inject({ url: '/api/recipes?q=soep' })).json()
      .items
    await t.app.inject({
      method: 'PUT',
      url: `/api/recipes/${id}`,
      payload: {
        title: 'Bouillon',
        servings: 2,
        ingredients: [{ name: 'selderij' }],
        tags: ['licht'],
      },
    })
    assert.deepEqual(await search('q=soep'), [])
    assert.deepEqual(await search('q=prei'), [])
    assert.deepEqual(await search('q=bouillon'), ['Bouillon'])
    assert.deepEqual(await search('q=selderij'), ['Bouillon'])
    assert.deepEqual(await search('q=licht'), ['Bouillon'])

    await t.app.inject({ method: 'DELETE', url: `/api/recipes/${id}` })
    await t.app.inject({ method: 'DELETE', url: `/api/trash/${id}` })
    const indexed = t.db
      .prepare('SELECT COUNT(*) FROM recipe_fts')
      .pluck()
      .get()
    assert.equal(indexed, 4)
  })
})
