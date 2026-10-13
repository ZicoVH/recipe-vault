import type { ActionFunctionArgs } from 'react-router'
import { serverMessage } from '../form/formModel'
import type { ServerFieldError } from '../form/formModel'

/** What the import form gets back from its action. */
export type ImportResult =
  | { status: 'done'; added: number }
  | { status: 'failed'; message: string; problems: string[] }

/** Mirrors the API limit (docs/api-model.md). */
const MAX_FILE_BYTES = 5 * 1024 * 1024
/** How many problems of a rejected file are listed. */
const MAX_LISTED_PROBLEMS = 5

const UNREACHABLE =
  'De server reageert niet. Controleer of de server draait en probeer het opnieuw.'

function failed(message: string, problems: string[] = []): ImportResult {
  return { status: 'failed', message, problems }
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Titel',
  servings: 'Personen',
  prepTimeMinutes: 'Voorbereiding',
  cookTimeMinutes: 'Kooktijd',
  tags: 'Tags',
}

const INGREDIENT_LABELS: Record<string, string> = {
  name: 'naam',
  quantity: 'hoeveelheid',
  unit: 'eenheid',
  note: 'opmerking',
}

/** Problems with the file as a whole, not with one recipe. */
function describeFileProblem({ path, code }: ServerFieldError): string {
  if (path === 'recipes' && code === 'too_long') {
    return 'Het bestand bevat te veel recepten. De grens is 5.000.'
  }
  if (path === 'recipes') return 'Het bestand bevat geen lijst met recepten.'
  if (path === 'schemaVersion') {
    return 'De versie van het bestand ontbreekt of is ongeldig.'
  }
  if (code === 'unknown_field') {
    return `Het bestand bevat een onbekend onderdeel: ‘${path}’.`
  }
  return `Het bestand is niet geldig: ${serverMessage(code)}`
}

/** "recipes[2].ingredients[0].name" becomes "Recept 3, ingrediënt 1, naam: …". */
function describeProblem(problem: ServerFieldError): string {
  const { path, code } = problem
  const recipe = /^recipes\[(\d+)\](?:\.(.+))?$/.exec(path)
  if (!recipe) return describeFileProblem(problem)

  const message = serverMessage(code)
  const where = `Recept ${Number(recipe[1]) + 1}`
  const field = recipe[2] ?? ''
  const ingredient = /^ingredients\[(\d+)\](?:\.(\w+))?$/.exec(field)
  const step = /^steps\[(\d+)\]/.exec(field)
  if (ingredient) {
    const label = INGREDIENT_LABELS[ingredient[2] ?? '']
    return `${where}, ingrediënt ${Number(ingredient[1]) + 1}${label ? `, ${label}` : ''}: ${message}`
  }
  if (step) return `${where}, stap ${Number(step[1]) + 1}: ${message}`
  if (code === 'unknown_field') {
    return `${where}: onbekend veld ‘${field}’.`
  }
  const label = FIELD_LABELS[field.split(/[.[]/)[0]]
  return label
    ? `${where}, ${label.toLowerCase()}: ${message}`
    : `${where}: ${message}`
}

async function failureFrom(response: Response): Promise<ImportResult> {
  let error: { code?: string; fields?: ServerFieldError[] } = {}
  try {
    error = ((await response.json()) as { error?: typeof error }).error ?? {}
  } catch {
    // Not a JSON error body (a proxy error, for example): use the status.
  }
  if (response.status === 413) {
    return failed('Het bestand is te groot. De grens is 5 MB.')
  }
  if (response.status === 422) {
    return failed(
      'Dit bestand heeft een versie die deze app niet kan lezen. Er is niets toegevoegd.',
    )
  }
  if (error.code === 'invalid_json') {
    return failed(
      'Dit bestand is geen geldig JSON-bestand. Er is niets toegevoegd.',
    )
  }
  if (error.code === 'validation_failed' && error.fields) {
    const listed = error.fields
      .slice(0, MAX_LISTED_PROBLEMS)
      .map(describeProblem)
    return failed(
      'Dit bestand bevat fouten. Er is niets toegevoegd.',
      error.fields.length > listed.length
        ? [...listed, 'En nog meer fouten.']
        : listed,
    )
  }
  return failed('Importeren is niet gelukt. Probeer het later opnieuw.')
}

/** Import page: sends the chosen file to the API. All or nothing. */
export async function importAction({
  request,
}: ActionFunctionArgs): Promise<ImportResult> {
  const file = (await request.formData()).get('file')
  if (!(file instanceof File) || file.size === 0) {
    return failed('Kies eerst een bestand om te importeren.')
  }
  if (file.size > MAX_FILE_BYTES) {
    return failed('Het bestand is te groot. De grens is 5 MB.')
  }

  let response: Response
  try {
    response = await fetch('/api/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: await file.text(),
      signal: request.signal,
    })
  } catch (error) {
    // An aborted request is a cancelled navigation, not a failure.
    if (request.signal.aborted) throw error
    return failed(UNREACHABLE)
  }
  if (!response.ok) return failureFrom(response)

  try {
    const { added } = (await response.json()) as { added: number }
    return { status: 'done', added }
  } catch {
    return failed('Importeren is niet gelukt. Probeer het later opnieuw.')
  }
}
