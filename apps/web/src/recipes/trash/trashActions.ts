import { redirect } from 'react-router'
import type { ActionFunctionArgs, ShouldRevalidateFunction } from 'react-router'

/** What the detail page and the trash page get back from their actions. */
export type TrashResult =
  | { status: 'done'; message: string; recipeId?: string }
  // `stale` means the page showed something that no longer exists.
  | { status: 'failed'; message: string; stale: boolean }

const UNREACHABLE =
  'De server reageert niet. Controleer of de server draait en probeer het opnieuw.'

type Outcome = { ok: true } | { ok: false; status: number | null }

async function call(
  method: 'DELETE' | 'POST',
  url: string,
  signal: AbortSignal,
): Promise<Outcome> {
  let response: Response
  try {
    response = await fetch(url, { method, signal })
  } catch (error) {
    // An aborted request is a cancelled navigation, not a failure.
    if (signal.aborted) throw error
    return { ok: false, status: null }
  }
  return response.ok ? { ok: true } : { ok: false, status: response.status }
}

function failure(status: number | null): TrashResult {
  if (status === null) {
    return { status: 'failed', message: UNREACHABLE, stale: false }
  }
  if (status === 404) {
    return {
      status: 'failed',
      message: 'Dit recept bestaat niet (meer).',
      stale: true,
    }
  }
  if (status === 409) {
    return {
      status: 'failed',
      message: 'Dit recept staat niet meer in de prullenbak.',
      stale: true,
    }
  }
  return {
    status: 'failed',
    message: 'Dat is niet gelukt. Probeer het later opnieuw.',
    stale: false,
  }
}

/** Detail page: moves the recipe to the trash, then shows the trash. */
export async function trashRecipeAction({
  params,
  request,
}: ActionFunctionArgs): Promise<TrashResult | Response> {
  const result = await call(
    'DELETE',
    `/api/recipes/${encodeURIComponent(params.recipeId ?? '')}`,
    request.signal,
  )
  return result.ok
    ? redirect(
        `/prullenbak?verwijderd=${encodeURIComponent(params.recipeId ?? '')}`,
      )
    : failure(result.status)
}

/** Trash page: restores a recipe or deletes it for good. */
export async function trashPageAction({
  request,
}: ActionFunctionArgs): Promise<TrashResult> {
  const form = await request.formData()
  const intent = form.get('intent')
  const id = form.get('id')
  const title = form.get('title')
  if (typeof id !== 'string' || id === '' || typeof title !== 'string') {
    return failure(400)
  }

  const path = `/api/trash/${encodeURIComponent(id)}`
  if (intent === 'restore') {
    const result = await call('POST', `${path}/restore`, request.signal)
    return result.ok
      ? { status: 'done', message: `‘${title}’ is teruggezet.`, recipeId: id }
      : failure(result.status)
  }
  if (intent === 'delete') {
    const result = await call('DELETE', path, request.signal)
    return result.ok
      ? { status: 'done', message: `‘${title}’ is definitief verwijderd.` }
      : failure(result.status)
  }
  return failure(400)
}

/**
 * Reload after anything that changed the data, or when the page turned out to
 * be out of date (the recipe is gone: the reload shows that). Keep the page as
 * it is when the request itself failed, so the message stays visible even if
 * the server is down.
 */
export const reloadUnlessRequestFailed: ShouldRevalidateFunction = ({
  formMethod,
  actionResult,
  defaultShouldRevalidate,
}) => {
  const result = actionResult as TrashResult | undefined
  if (formMethod && result?.status === 'failed' && !result.stale) return false
  return defaultShouldRevalidate
}
