import type { LoaderFunctionArgs, ShouldRevalidateFunction } from 'react-router'
import { ApiError, getJson } from '../api/client'
import { normalizeTags } from './searchParams'
import type { Recipe, RecipeSummary, TagCount } from './types'

/**
 * After a save that did not succeed (server unreachable, invalid, 404, 409)
 * the edit page must keep showing the form with the typed data, even when the
 * recipe is gone. Reloading the recipe at that moment would replace the form
 * with an error or not-found page, so skip it. A successful save redirects,
 * which loads the next page.
 */
export const keepFormAfterFailedSave: ShouldRevalidateFunction = ({
  formMethod,
  actionResult,
  defaultShouldRevalidate,
}) => {
  const failed =
    typeof actionResult === 'object' &&
    actionResult !== null &&
    'status' in actionResult
  if (formMethod && failed) return false
  return defaultShouldRevalidate
}

export async function trashLoader({
  request,
}: LoaderFunctionArgs): Promise<RecipeSummary[]> {
  const { items } = await getJson<{ items: RecipeSummary[] }>(
    '/api/trash',
    request.signal,
  )
  return items
}

/** What the overview shows: the matching recipes and the query they match. */
export type OverviewData = {
  recipes: RecipeSummary[]
  /** All tags in use, for the tag filter. */
  tags: TagCount[]
  /** The search text and tags the recipes were loaded for. */
  q: string
  selectedTags: string[]
}

/** Search text (`?q=`) and tag filters (`tag=`, all must match) come from the URL. */
export async function overviewLoader({
  request,
}: LoaderFunctionArgs): Promise<OverviewData> {
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  const selectedTags = normalizeTags(url.searchParams.getAll('tag'))

  const params = new URLSearchParams()
  if (q !== '') params.set('q', q)
  for (const tag of selectedTags) params.append('tag', tag)
  const query = params.toString()

  const [list, tagList] = await Promise.all([
    getJson<{ items: RecipeSummary[] }>(
      `/api/recipes${query ? `?${query}` : ''}`,
      request.signal,
    ),
    // The tag list only feeds the filter, so a failure here must not take a
    // working search down with it.
    getJson<{ items: TagCount[] }>('/api/tags', request.signal).catch(
      (error: unknown) => {
        if (request.signal.aborted) throw error
        return { items: [] as TagCount[] }
      },
    ),
  ])
  return { recipes: list.items, tags: tagList.items, q, selectedTags }
}

/**
 * Returns null when the recipe does not exist or is in the trash, so the page
 * shows the not-found message. Other failures reach the route error page.
 */
export async function detailLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<Recipe | null> {
  try {
    const recipe = await getJson<Recipe>(
      `/api/recipes/${encodeURIComponent(params.recipeId ?? '')}`,
      request.signal,
    )
    return recipe.deletedAt === null ? recipe : null
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}
