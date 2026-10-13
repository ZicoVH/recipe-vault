import { redirect } from 'react-router'
import type { ActionFunctionArgs } from 'react-router'
import type { RecipeInput } from '../types'
import type { ServerFieldError } from './formModel'

/** What the form receives from its action when saving did not succeed. */
export type SaveResult =
  | { status: 'invalid'; fields: ServerFieldError[] }
  | { status: 'failed'; message: string }

/** The body the form submits: the request plus the keys of the rows in it. */
export type SaveBody = { payload: RecipeInput }

async function save(
  method: 'POST' | 'PUT',
  url: string,
  request: Request,
): Promise<SaveResult | Response> {
  const { payload } = (await request.json()) as SaveBody
  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: request.signal,
    })
  } catch (error) {
    if (request.signal.aborted) throw error
    return {
      status: 'failed',
      message:
        'De server reageert niet. Controleer of de server draait en probeer het opnieuw. Je gegevens zijn bewaard in het formulier.',
    }
  }

  if (response.ok) {
    const recipe = (await response.json()) as { id: string }
    return redirect(`/recepten/${encodeURIComponent(recipe.id)}`)
  }
  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as {
      error?: { fields?: ServerFieldError[] }
    } | null
    return { status: 'invalid', fields: body?.error?.fields ?? [] }
  }
  if (response.status === 404) {
    return { status: 'failed', message: 'Dit recept bestaat niet (meer).' }
  }
  if (response.status === 409) {
    return {
      status: 'failed',
      message:
        'Dit recept staat in de prullenbak en kan niet worden aangepast.',
    }
  }
  return {
    status: 'failed',
    message:
      'Het recept kon niet worden opgeslagen. Probeer het later opnieuw.',
  }
}

export function createRecipeAction({ request }: ActionFunctionArgs) {
  return save('POST', '/api/recipes', request)
}

export function updateRecipeAction({ request, params }: ActionFunctionArgs) {
  return save(
    'PUT',
    `/api/recipes/${encodeURIComponent(params.recipeId ?? '')}`,
    request,
  )
}
