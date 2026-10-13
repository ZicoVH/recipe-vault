// Recipe model from docs/api-model.md.

export type Ingredient = {
  name: string
  quantity: number | null
  unit: string | null
  note: string | null
}

/** The editable fields of a recipe, after validation and normalization. */
export type RecipeInput = {
  title: string
  servings: number
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  ingredients: Ingredient[]
  steps: string[]
  tags: string[]
}

export type Recipe = RecipeInput & {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
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

export type FieldError = { path: string; code: string }
