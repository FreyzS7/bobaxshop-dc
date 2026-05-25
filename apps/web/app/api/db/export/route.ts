import { auth } from "@/lib/auth"
import { db } from "@bobaxshop/database"
import { sql } from "drizzle-orm"

type Row = Record<string, unknown>

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== "superadmin") {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const lines: string[] = []
    const now = new Date().toISOString()

    lines.push(`-- BobaxShop Database Dump`)
    lines.push(`-- Generated: ${now}`)
    lines.push(`--`)
    lines.push(`SET FOREIGN_KEY_CHECKS=0;`)
    lines.push(`SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';`)
    lines.push(`SET NAMES utf8mb4;`)
    lines.push(``)

    // Drizzle execute() returns rows directly (not [rows, fields])
    const [tables] = await db.execute(sql`SHOW TABLES`) as unknown as [Row[], unknown]
    const tableNames = tables.map((row) => Object.values(row)[0] as string)

    for (const table of tableNames) {
      const [createRows] = await db.execute(sql.raw(`SHOW CREATE TABLE \`${table}\``)) as unknown as [Row[], unknown]
      const createStmt = createRows[0]['Create Table'] as string

      lines.push(`-- Table: ${table}`)
      lines.push(`DROP TABLE IF EXISTS \`${table}\`;`)
      lines.push(createStmt + `;`)
      lines.push(``)

      const [dataRows] = await db.execute(sql.raw(`SELECT * FROM \`${table}\``)) as unknown as [Row[], unknown]

      if (dataRows.length > 0) {
        const cols = Object.keys(dataRows[0]).map((c) => `\`${c}\``).join(', ')
        const valueLines = dataRows.map((row) => {
          const vals = Object.values(row).map((v) => {
            if (v === null || v === undefined) return 'NULL'
            if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`
            if (typeof v === 'number' || typeof v === 'bigint') return String(v)
            if (typeof v === 'boolean') return v ? '1' : '0'
            return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
          })
          return `  (${vals.join(', ')})`
        })
        lines.push(`INSERT INTO \`${table}\` (${cols}) VALUES`)
        lines.push(valueLines.join(',\n') + `;`)
        lines.push(``)
      }
    }

    lines.push(`SET FOREIGN_KEY_CHECKS=1;`)

    const dump = lines.join('\n')
    const filename = `bobaxshop-dump-${now.slice(0, 10)}.sql`

    return new Response(dump, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return new Response("Export gagal: " + String(err), { status: 500 })
  }
}
