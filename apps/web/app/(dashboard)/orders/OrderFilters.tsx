"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { type OrderStatus, STATUS_META } from "@/components/ui/order-status-badge"

const ALL_STATUSES = Object.keys(STATUS_META) as OrderStatus[]

export function OrderFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("status") ?? ""

  function setFilter(status: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (status) {
      params.set("status", status)
    } else {
      params.delete("status")
    }
    params.delete("page")
    router.push(`/orders?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <FilterChip active={current === ""} onClick={() => setFilter("")}>
        All
      </FilterChip>
      {ALL_STATUSES.map((status) => (
        <FilterChip key={status} active={current === status} onClick={() => setFilter(status)}>
          {STATUS_META[status].label}
        </FilterChip>
      ))}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}
