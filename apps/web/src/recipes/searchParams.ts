/**
 * Trims tags, drops empty ones and duplicates ignoring case, and keeps the
 * first spelling. Used for the tags in the URL, so the loader, the filter and
 * the API all see the same list.
 */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of tags) {
    const tag = raw.trim()
    const key = tag.toLowerCase()
    if (tag === '' || seen.has(key)) continue
    seen.add(key)
    result.push(tag)
  }
  return result
}
