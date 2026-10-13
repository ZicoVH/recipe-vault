import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import type { Database } from 'better-sqlite3'

export type AppOptions = {
  db: Database
  logger?: boolean
}

export function buildApp({ db, logger = false }: AppOptions): FastifyInstance {
  const app = Fastify({ logger })

  app.get('/api/health', async (_request, reply) => {
    try {
      db.prepare('SELECT 1').get()
      return { status: 'ok' }
    } catch {
      return reply.code(503).send({ status: 'unavailable' })
    }
  })

  return app
}
