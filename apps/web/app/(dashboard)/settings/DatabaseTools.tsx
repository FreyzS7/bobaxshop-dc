"use client"

import { useRef, useState } from "react"

export function DatabaseTools() {
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    const fd = new FormData()
    fd.append("file", file)

    try {
      const res = await fetch("/api/db/import", { method: "POST", body: fd })
      const data = await res.json() as { message?: string; error?: string; errors?: string[] }
      setImportResult({
        ok: res.ok,
        text: data.message ?? data.error ?? "Unknown error",
      })
    } catch {
      setImportResult({ ok: false, text: "Gagal menghubungi server." })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {/* Export */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground font-medium">Export Database</p>
          <p className="text-xs text-muted-foreground mt-0.5">Download semua data sebagai file .sql</p>
        </div>
        <a
          href="/api/db/export"
          download
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          ⬇ Download .sql
        </a>
      </div>

      <div className="border-t border-border" />

      {/* Import */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground font-medium">Import Database</p>
          <p className="text-xs text-muted-foreground mt-0.5">Restore dari file .sql — <span className="text-destructive font-medium">data lama akan ditimpa</span></p>
        </div>
        <label className={`px-4 py-2 rounded-md border border-border bg-background text-foreground text-sm font-medium cursor-pointer hover:bg-accent transition-colors ${importing ? "opacity-50 pointer-events-none" : ""}`}>
          {importing ? "Mengimpor..." : "⬆ Upload .sql"}
          <input
            ref={fileRef}
            type="file"
            accept=".sql"
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />
        </label>
      </div>

      {importResult && (
        <p className={`text-xs px-3 py-2 rounded-md ${importResult.ok ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
          {importResult.ok ? "✓" : "✗"} {importResult.text}
        </p>
      )}
    </div>
  )
}
