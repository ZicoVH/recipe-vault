import type { LoaderFunctionArgs, ShouldRevalidateFunction } from 'react-router'
import { ApiError, getJson } from '../api/client'
import type { Recipe, RecipeSummary } from './types'

/**
 * The search box keeps its query in the URL (`?q=`), and each keystroke is a
 * navigation. The list does not depend on the query yet (title search runs in
 * the browser), so a change of the query string alone must not refetch it.
 * Revisit this when search moves to the API (ticket 2.4).
 */
export const ignoreSearchChange: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}) => {
  if (
    !formMethod &&
    currentUrl.pathname === nextUrl.pathname &&
    currentUrl.search !== nextUrl.search
  ) {
    return false
  }
  return defaultShouldRevalidate
}

/**
 * After a save that did not succeed (server unreachable, invalid, 404, 409)
 * the edit page must keep showing the form with the typed data. Reloading the
 * recipe at that moment would replace the form with an error or not-found
 * page, so skip it. A successful save redirects, which loads the next page.
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

export async function overviewLoader({
  request,
}: LoaderFunctionArgs): Promise<RecipeSummary[]> {
  const { items } = await getJson<{ items: RecipeSummary[] }>(
    '/api/recipes',
    request.signal,
  )
  return items
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
