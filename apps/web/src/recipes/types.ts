/**
 * Temporary frontend model for the mock data. Not the final recipe model,
 * and not a persistence or API contract. To be replaced by the model in
 * docs/api-model.md when the frontend moves to the API (ticket 2.1).
 */
export type Ingredient = {
  /** Free display text such as "500 g", "2" or "een snuf". */
  amount?: string
  name: string
}

export type Recipe = {
  id: string
  title: string
  servings: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  tags: string[]
  ingredients: Ingredient[]
  steps: string[]
}
