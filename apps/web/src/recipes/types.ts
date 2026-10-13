/**
 * Recipe model as returned by the API. Mirrors docs/api-model.md: keep the two
 * in sync when the contract changes.
 */
export type Ingredient = {
  name: string
  quantity: number | null
  unit: string | null
  note: string | null
}

export type RecipeSummary = {
  id: string
  title: string
  servings: number
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  tags: string[]
  deletedAt: string | null
}

export type Recipe = RecipeSummary & {
  ingredients: Ingredient[]
  steps: string[]
  createdAt: string
  updatedAt: string
}
