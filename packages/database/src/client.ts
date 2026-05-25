import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

type DB = ReturnType<typeof drizzle<typeof schema>>

let _db: DB | undefined

function ensureDb(): DB {
  if (!_db) {
    const dbUrl = new URL(process.env.DATABASE_URL!)
    const pool = mysql.createPool({
      host: dbUrl.hostname,
      port: dbUrl.port ? Number(dbUrl.port) : 3306,
      user: dbUrl.username || 'root',
      password: dbUrl.password || undefined,
      database: dbUrl.pathname.replace('/', ''),
      timezone: '+00:00',
    })
    // Set MySQL session timezone ke UTC agar timestamp konsisten dengan Date.now()
    pool.on('connection', (conn) => {
      conn.query("SET time_zone = '+00:00'")
    })
    _db = drizzle(pool, { schema, mode: 'default' }) as unknown as DB
  }
  return _db
}

// Proxy agar pool hanya dibuat saat query pertama dijalankan
// (setelah dotenv sudah diload di index.ts)
export const db = new Proxy({} as DB, {
  get(_, key) {
    return Reflect.get(ensureDb(), key as string)
  },
})
