/**
 * Minimal model for the recipe overview cards only. Not the final recipe
 * model, and not a persistence or API contract.
 */
export type Recipe = {
  id: string
  title: string
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  tags: string[]
}
