/** Lowercases and strips accents so "Crème" and "creme" compare equal. */
function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/**
 * Keeps recipes whose title contains every word of the query, ignoring case
 * and accents. An empty or whitespace-only query keeps everything.
 */
export function filterRecipesByTitle<T extends { title: string }>(
  recipes: T[],
  query: string,
): T[] {
  const words = normalizeForSearch(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return recipes

  return recipes.filter((recipe) => {
    const title = normalizeForSearch(recipe.title)
    return words.every((word) => title.includes(word))
  })
}
