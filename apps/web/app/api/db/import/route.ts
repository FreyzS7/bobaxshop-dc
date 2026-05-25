import { auth } from "@/lib/auth"
import { db } from "@bobaxshop/database"
import { sql } from "drizzle-orm"

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== "superadmin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return Response.json({ error: "File tidak ditemukan" }, { status: 400 })

    const content = await file.text()

    // Split statements — pisahkan berdasarkan `;` di akhir baris
    const statements = content
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    let executed = 0
    const errors: string[] = []

    for (const stmt of statements) {
      try {
        await db.execute(sql.raw(stmt))
        executed++
      } catch (err) {
        errors.push(`[${executed + 1}] ${err instanceof Error ? err.message.slice(0, 100) : String(err)}`)
      }
    }

    return Response.json({
      success: true,
      executed,
      errors: errors.length > 0 ? errors : undefined,
      message: `${executed} statement berhasil dijalankan.${errors.length > 0 ? ` ${errors.length} error.` : ''}`,
    })
  } catch (err) {
    console.error('Import error:', err)
    return Response.json({ error: "Import gagal: " + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}
