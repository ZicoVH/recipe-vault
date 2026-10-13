/** A failed API call. `status` is null when the server could not be reached. */
export class ApiError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function getJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      signal,
      headers: { accept: 'application/json' },
    })
  } catch (error) {
    // An aborted request is a cancelled navigation, not a failure.
    if (signal?.aborted) throw error
    throw new ApiError('The server could not be reached', null)
  }
  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
    )
  }
  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('The response is not valid JSON', response.status)
  }
}
