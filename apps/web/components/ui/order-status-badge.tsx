import { cn } from "@/lib/utils"

export type OrderStatus =
  | "waiting_payment"
  | "paid"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded"

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  waiting_payment: { label: "Waiting Payment", className: "bg-zinc-700/60 text-zinc-300" },
  paid:            { label: "Paid",            className: "bg-blue-500/15 text-blue-400" },
  processing:      { label: "Processing",      className: "bg-yellow-500/15 text-yellow-400" },
  completed:       { label: "Completed",       className: "bg-green-500/15 text-green-400" },
  cancelled:       { label: "Cancelled",       className: "bg-red-500/15 text-red-400" },
  refunded:        { label: "Refunded",        className: "bg-purple-500/15 text-purple-400" },
}

export function OrderStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as OrderStatus] ?? { label: status, className: "bg-zinc-700/60 text-zinc-300" }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", meta.className)}>
      {meta.label}
    </span>
  )
}

export { STATUS_META }
