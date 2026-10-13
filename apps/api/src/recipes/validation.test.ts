import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validateRecipeInput } from './validation.ts'

const valid = { title: 'Soep', servings: 4 }

function fieldsOf(body: unknown) {
  const result = validateRecipeInput(body)
  assert.equal(result.ok, false)
  return result.ok ? [] : result.fields
}

describe('validateRecipeInput', () => {
  it('accepts the minimum and fills defaults', () => {
    const result = validateRecipeInput(valid)
    assert.deepEqual(result, {
      ok: true,
      value: {
        title: 'Soep',
        servings: 4,
        prepTimeMinutes: null,
        cookTimeMinutes: null,
        ingredients: [],
        steps: [],
        tags: [],
      },
    })
  })

  it('requires title and servings', () => {
    assert.deepEqual(fieldsOf({}), [
      { path: 'title', code: 'required' },
      { path: 'servings', code: 'required' },
    ])
    assert.deepEqual(fieldsOf({ title: '   ', servings: 2 }), [
      { path: 'title', code: 'required' },
    ])
  })

  it('requires servings to be a positive whole number', () => {
    assert.deepEqual(fieldsOf({ ...valid, servings: 0 }), [
      { path: 'servings', code: 'out_of_range' },
    ])
    assert.deepEqual(fieldsOf({ ...valid, servings: -2 }), [
      { path: 'servings', code: 'out_of_range' },
    ])
    assert.deepEqual(fieldsOf({ ...valid, servings: 2.5 }), [
      { path: 'servings', code: 'not_integer' },
    ])
    assert.deepEqual(fieldsOf({ ...valid, servings: '4' }), [
      { path: 'servings', code: 'wrong_type' },
    ])
  })

  it('validates optional times', () => {
    const ok = validateRecipeInput({
      ...valid,
      prepTimeMinutes: 10,
      cookTimeMinutes: null,
    })
    assert.equal(ok.ok, true)
    assert.deepEqual(fieldsOf({ ...valid, prepTimeMinutes: 0 }), [
      { path: 'prepTimeMinutes', code: 'out_of_range' },
    ])
  })

  it('accepts free-expression ingredients and trims optional text', () => {
    const result = validateRecipeInput({
      ...valid,
      ingredients: [
        { name: 'een snufje zout' },
        { name: ' boter ', quantity: 2.5, unit: ' el ', note: '  ' },
      ],
    })
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.deepEqual(result.value.ingredients, [
        { name: 'een snufje zout', quantity: null, unit: null, note: null },
        { name: 'boter', quantity: 2.5, unit: 'el', note: null },
      ])
    }
  })

  it('reports ingredient problems with their path', () => {
    assert.deepEqual(
      fieldsOf({
        ...valid,
        ingredients: [
          { name: 'ok' },
          { name: '' },
          { name: 'x', quantity: 0 },
          { name: 'y', extra: 1 },
        ],
      }),
      [
        { path: 'ingredients[1].name', code: 'required' },
        { path: 'ingredients[2].quantity', code: 'out_of_range' },
        { path: 'ingredients[3].extra', code: 'unknown_field' },
      ],
    )
  })

  it('rejects unknown top-level fields, including server-owned ones', () => {
    assert.deepEqual(fieldsOf({ ...valid, id: 'x', deletedAt: null }), [
      { path: 'id', code: 'unknown_field' },
      { path: 'deletedAt', code: 'unknown_field' },
    ])
  })

  it('trims tags, drops empty ones and collapses duplicates ignoring case', () => {
    const result = validateRecipeInput({
      ...valid,
      tags: [' Winter ', 'winter', 'WINTER', '', '  ', 'Snel'],
    })
    assert.equal(result.ok, true)
    if (result.ok) assert.deepEqual(result.value.tags, ['Winter', 'Snel'])
  })

  it('rejects a body that is not an object', () => {
    assert.deepEqual(fieldsOf([]), [{ path: '', code: 'wrong_type' }])
    assert.deepEqual(fieldsOf('x'), [{ path: '', code: 'wrong_type' }])
    assert.deepEqual(fieldsOf(null), [{ path: '', code: 'wrong_type' }])
  })

  it('rejects empty steps and keeps the order of valid ones', () => {
    assert.deepEqual(fieldsOf({ ...valid, steps: ['a', ' '] }), [
      { path: 'steps[1]', code: 'required' },
    ])
    const result = validateRecipeInput({ ...valid, steps: ['b', 'a'] })
    if (result.ok) assert.deepEqual(result.value.steps, ['b', 'a'])
  })
})
