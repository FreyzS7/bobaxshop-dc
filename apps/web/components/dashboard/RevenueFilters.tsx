"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { CalendarRange } from "lucide-react"

const PRESETS = [
  { label: "Hari Ini", value: "today" },
  { label: "7 Hari", value: "7d" },
  { label: "30 Hari", value: "30d" },
  { label: "Bulan Ini", value: "month" },
  { label: "Semua", value: "all" },
] as const

type Preset = typeof PRESETS[number]["value"]

export function RevenueFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preset: string = searchParams.get("preset") ?? "7d"
  const [from, setFrom] = useState(searchParams.get("from") ?? "")
  const [to, setTo] = useState(searchParams.get("to") ?? "")
  const [showCustom, setShowCustom] = useState(preset === "custom")

  function applyPreset(value: Preset) {
    setShowCustom(false)
    const params = new URLSearchParams()
    params.set("preset", value)
    router.push(`/?${params.toString()}`)
  }

  function applyCustomRange() {
    if (!from || !to) return
    const params = new URLSearchParams()
    params.set("preset", "custom")
    params.set("from", from)
    params.set("to", to)
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => applyPreset(p.value)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors border",
              preset === p.value && preset !== "custom"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}

        <button
          onClick={() => setShowCustom((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors border",
            preset === "custom"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <CalendarRange size={12} />
          {preset === "custom" && from && to ? `${from} — ${to}` : "Custom"}
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Dari</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 px-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <span className="text-muted-foreground text-xs">—</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Sampai</label>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 px-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={applyCustomRange}
            disabled={!from || !to}
            className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            Terapkan
          </button>
        </div>
      )}
    </div>
  )
}
