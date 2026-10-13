import { buildApp } from './app.ts'
import { loadConfig } from './config.ts'
import { openDatabase } from './db.ts'

const config = loadConfig()
const db = openDatabase(config.dataDir)
const app = buildApp({ db, logger: true })

let shuttingDown = false
async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  app.log.info(`Received ${signal}, shutting down`)
  try {
    await app.close()
    db.close()
    process.exit(0)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

try {
  await app.listen({ host: config.host, port: config.port })
} catch (error) {
  app.log.error(error)
  db.close()
  process.exit(1)
}
