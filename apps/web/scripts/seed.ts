import { existsSync, readFileSync } from "fs"
import { resolve } from "path"

// Load root .env DULU sebelum import apapun yang butuh env
const envPath = resolve(__dirname, "../../../.env")
if (existsSync(envPath)) {
  readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) return
      const idx = trimmed.indexOf("=")
      if (idx === -1) return
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (key && !(key in process.env)) process.env[key] = val
    })
}

async function seed() {
  const { drizzle } = await import("drizzle-orm/mysql2")
  const { createPool } = await import("mysql2/promise")
  const { webUsers } = await import("@bobaxshop/database")
  const bcrypt = await import("bcryptjs")

  const pool = createPool({ uri: process.env.DATABASE_URL })
  const db = drizzle(pool, { schema: { webUsers }, mode: "default" })

  const email = process.argv[2] ?? "admin@bobaxshop.com"
  const password = process.argv[3] ?? "Admin123!"
  const name = process.argv[4] ?? "Super Admin"

  const existing = await db.query.webUsers.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  })
  if (existing) {
    console.log(`❌ User dengan email ${email} sudah ada.`)
    await pool.end()
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.insert(webUsers).values({ email, passwordHash, name, role: "superadmin" })

  console.log("✅ Superadmin berhasil dibuat:")
  console.log(`   Email   : ${email}`)
  console.log(`   Password: ${password}`)
  console.log(`   Role    : superadmin`)
  await pool.end()
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Seed gagal:", err.message ?? err)
  process.exit(1)
})
