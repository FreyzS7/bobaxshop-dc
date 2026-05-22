import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL harus berupa URL valid'),
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN wajib diisi'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID wajib diisi'),
  MIDTRANS_SERVER_KEY: z.string().min(1, 'MIDTRANS_SERVER_KEY wajib diisi'),
  MIDTRANS_CLIENT_KEY: z.string().min(1, 'MIDTRANS_CLIENT_KEY wajib diisi'),
  MIDTRANS_IS_PRODUCTION: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  BOT_WEBHOOK_SECRET: z.string().optional(),
  WEBHOOK_PORT: z.string().transform(Number).default('3001'),
  BOT_API_URL: z.string().url().default('http://localhost:3001'),
  BOT_API_SECRET: z.string().default('bobax-internal-api-2026'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

let _env: Env

export function getEnv(): Env {
  if (_env) return _env

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Environment variable tidak valid:')
    console.error(result.error.flatten().fieldErrors)
    process.exit(1)
  }

  _env = result.data
  return _env
}
