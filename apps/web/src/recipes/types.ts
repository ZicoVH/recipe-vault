/**
 * Temporary frontend model for the mock data. Not the final recipe model,
 * and not a persistence or API contract.
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
