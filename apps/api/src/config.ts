import { resolve } from 'node:path'

export type Config = {
  host: string
  port: number
  dataDir: string
}

/**
 * Reads the runtime configuration from environment variables.
 * HOST defaults to loopback: the API is not meant to be reachable from the
 * internet. The container sets HOST=0.0.0.0 explicitly.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.PORT ?? 3000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${env.PORT}`)
  }
  return {
    host: env.HOST ?? '127.0.0.1',
    port,
    dataDir: resolve(env.DATA_DIR ?? './data'),
  }
}
