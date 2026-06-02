"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { CalendarRange, ChevronDown } from "lucide-react"

const PRESETS = [
  { label: "Hari Ini",  value: "today" },
  { label: "Kemarin",   value: "yesterday" },
  { label: "7 Hari",    value: "7d" },
  { label: "30 Hari",   value: "30d" },
  { label: "Bulan Ini", value: "month" },
  { label: "Semua",     value: "all" },
] as const

type Preset = typeof PRESETS[number]["value"]

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"]

function getAvailableMonths() {
  const now = new Date()
  const months: { year: number; month: number; value: string }[] = []
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      value: `month:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    })
  }
  return months
}

function groupByYear(months: ReturnType<typeof getAvailableMonths>) {
  const map = new Map<number, typeof months>()
  for (const m of months) {
    if (!map.has(m.year)) map.set(m.year, [])
    map.get(m.year)!.push(m)
  }
  return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
}

export function RevenueFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preset: string = searchParams.get("preset") ?? "7d"
  const [from, setFrom] = useState(searchParams.get("from") ?? "")
  const [to, setTo] = useState(searchParams.get("to") ?? "")
  const [showCustom, setShowCustom] = useState(preset === "custom")
  const [showMonths, setShowMonths] = useState(false)

  const months = getAvailableMonths()
  const byYear = groupByYear(months)

  function push(params: URLSearchParams) {
    router.push(`/?${params.toString()}`)
  }

  function applyPreset(value: Preset) {
    setShowCustom(false)
    setShowMonths(false)
    const p = new URLSearchParams(searchParams.toString())
    p.set("preset", value)
    p.delete("from")
    p.delete("to")
    push(p)
  }

  function applyMonth(value: string) {
    setShowMonths(false)
    const p = new URLSearchParams(searchParams.toString())
    p.set("preset", value)
    p.delete("from")
    p.delete("to")
    push(p)
  }

  function applyCustomRange() {
    if (!from || !to) return
    const p = new URLSearchParams(searchParams.toString())
    p.set("preset", "custom")
    p.set("from", from)
    p.set("to", to)
    push(p)
  }

  const isMonthPreset = preset.startsWith("month:")
  const activeMonthLabel = isMonthPreset
    ? (() => {
        const [, ym] = preset.split(":")
        const [y, m] = ym.split("-")
        return `${MONTH_NAMES[Number(m) - 1]} ${y}`
      })()
    : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => applyPreset(p.value)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors border",
              preset === p.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}

        {/* Month picker */}
        <div className="relative">
          <button
            onClick={() => { setShowMonths((v) => !v); setShowCustom(false) }}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors border",
              isMonthPreset
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {activeMonthLabel ?? "Pilih Bulan"}
            <ChevronDown size={11} />
          </button>

          {showMonths && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-xl p-3 w-64 space-y-3">
              {byYear.map(([year, ms]) => (
                <div key={year}>
                  <p className="text-[10px] text-muted-foreground font-semibold mb-1.5">{year}</p>
                  <div className="grid grid-cols-4 gap-1">
                    {ms.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => applyMonth(m.value)}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium transition-colors",
                          preset === m.value
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {MONTH_NAMES[m.month]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom range */}
        <button
          onClick={() => { setShowCustom((v) => !v); setShowMonths(false) }}
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
