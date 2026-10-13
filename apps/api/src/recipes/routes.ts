import type { Database } from 'better-sqlite3'
import type { FastifyInstance } from 'fastify'
import { sendError } from '../errors.ts'
import {
  createRecipe,
  getRecipe,
  listRecipes,
  listTags,
  updateRecipe,
} from './repository.ts'
import { validateRecipeInput } from './validation.ts'

export function registerRecipeRoutes(app: FastifyInstance, db: Database) {
  app.get('/api/recipes', async () => ({ items: listRecipes(db) }))

  app.get('/api/tags', async () => ({ items: listTags(db) }))

  app.post('/api/recipes', async (request, reply) => {
    const result = validateRecipeInput(request.body)
    if (!result.ok) {
      return sendError(
        reply,
        400,
        'validation_failed',
        'Invalid recipe',
        result.fields,
      )
    }
    return reply.code(201).send(createRecipe(db, result.value))
  })

  app.get<{ Params: { id: string } }>(
    '/api/recipes/:id',
    async (request, reply) => {
      const recipe = getRecipe(db, request.params.id)
      if (!recipe) return sendError(reply, 404, 'not_found', 'Recipe not found')
      return recipe
    },
  )

  app.put<{ Params: { id: string } }>(
    '/api/recipes/:id',
    async (request, reply) => {
      const result = validateRecipeInput(request.body)
      if (!result.ok) {
        return sendError(
          reply,
          400,
          'validation_failed',
          'Invalid recipe',
          result.fields,
        )
      }
      const update = updateRecipe(db, request.params.id, result.value)
      if (update.status === 'not_found') {
        return sendError(reply, 404, 'not_found', 'Recipe not found')
      }
      if (update.status === 'trashed') {
        return sendError(
          reply,
          409,
          'recipe_trashed',
          'A trashed recipe cannot be edited',
        )
      }
      return update.recipe
    },
  )
}
