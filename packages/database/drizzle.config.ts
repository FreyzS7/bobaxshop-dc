import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../../.env') })

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
