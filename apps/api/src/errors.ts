import type { FastifyInstance, FastifyReply } from 'fastify'
import type { FieldError } from './recipes/types.ts'

/** Sends the error shape from docs/api-model.md. */
export function sendError(
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
  fields?: FieldError[],
) {
  return reply.code(status).send({
    error: { code, message, ...(fields ? { fields } : {}) },
  })
}

export function registerErrorHandlers(app: FastifyInstance) {
  app.setNotFoundHandler((_request, reply) =>
    sendError(reply, 404, 'not_found', 'Not found'),
  )
  app.setErrorHandler(
    (error: { code?: string; statusCode?: number }, request, reply) => {
      if (
        error.code === 'FST_ERR_CTP_INVALID_JSON_BODY' ||
        error.code === 'FST_ERR_CTP_INVALID_CONTENT_LENGTH'
      ) {
        return sendError(
          reply,
          400,
          'invalid_json',
          'The request body is not valid JSON',
        )
      }
      if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
        return sendError(
          reply,
          413,
          'payload_too_large',
          'The request body is too large',
        )
      }
      if (
        error.statusCode &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      ) {
        return sendError(reply, error.statusCode, 'bad_request', 'Bad request')
      }
      request.log.error(error)
      return sendError(reply, 500, 'internal_error', 'Internal server error')
    },
  )
}
