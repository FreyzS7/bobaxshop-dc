import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

type DB = ReturnType<typeof drizzle<typeof schema>>

let _db: DB | undefined

function ensureDb(): DB {
  if (!_db) {
    const pool = mysql.createPool(process.env.DATABASE_URL!)
    _db = drizzle(pool, { schema, mode: 'default' })
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
