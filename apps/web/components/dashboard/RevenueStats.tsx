import { db } from "@bobaxshop/database"
import { sql } from "drizzle-orm"
import { TrendingUp, ShoppingCart, CheckCircle, XCircle, Coins } from "lucide-react"
import StatsCard from "./StatsCard"
import { formatIDR } from "@bobaxshop/shared"

interface Props {
  preset: string
  from?: string
  to?: string
  guildId?: string
}

function resolveDateRange(preset: string, customFrom?: string, customTo?: string) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

  if (preset === "custom" && customFrom && customTo) {
    return { from: `${customFrom} 00:00:00`, to: `${customTo} 23:59:59` }
  }
  if (preset === "all") return { from: '2000-01-01 00:00:00', to: fmt(now) }
  if (preset === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    return { from: fmt(from), to: fmt(now) }
  }
  if (preset === "7d") {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0)
    return { from: fmt(from), to: fmt(now) }
  }
  if (preset === "30d") {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0)
    return { from: fmt(from), to: fmt(now) }
  }
  // today
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  return { from: fmt(from), to: fmt(now) }
}

export async function RevenueStats({ preset, from: customFrom, to: customTo, guildId }: Props) {
  const range = resolveDateRange(preset, customFrom, customTo)

  type StatsRow = { total: number; completed: number; cancelled: number; revenue: string | null; robux_out: number | null }
  const result = await db.execute<StatsRow>(sql`
    SELECT
      COUNT(*) AS total,
      SUM(order_status = 'completed') AS completed,
      SUM(order_status = 'cancelled') AS cancelled,
      SUM(CASE WHEN order_status = 'completed' THEN price_idr ELSE 0 END) AS revenue,
      SUM(CASE WHEN order_status = 'completed' THEN robux_amount ELSE 0 END) AS robux_out
    FROM orders
    WHERE created_at >= ${range.from}
      AND created_at <= ${range.to}
      ${guildId ? sql`AND guild_id = ${guildId}` : sql``}
  `)

  const row = (result[0] as unknown as StatsRow[])[0]
  const total = Number(row?.total ?? 0)
  const completed = Number(row?.completed ?? 0)
  const cancelled = Number(row?.cancelled ?? 0)
  const totalRevenue = Number(row?.revenue ?? 0)
  const robuxOut = Number(row?.robux_out ?? 0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <StatsCard
        title="Pendapatan"
        value={formatIDR(totalRevenue)}
        sub="order selesai"
        icon={TrendingUp}
        color="text-emerald-400"
      />
      <StatsCard
        title="Robux Keluar"
        value={`${robuxOut.toLocaleString("id-ID")} R$`}
        sub="order selesai"
        icon={Coins}
        color="text-yellow-400"
      />
      <StatsCard
        title="Total Order"
        value={total}
        icon={ShoppingCart}
        color="text-indigo-400"
      />
      <StatsCard
        title="Selesai"
        value={completed}
        sub={total > 0 ? `${Math.round((completed / total) * 100)}% dari total` : undefined}
        icon={CheckCircle}
        color="text-green-400"
      />
      <StatsCard
        title="Dibatalkan"
        value={cancelled}
        icon={XCircle}
        color="text-red-400"
      />
    </div>
  )
}
