import { Suspense } from "react"
export const dynamic = 'force-dynamic'
import { db, orders } from "@bobaxshop/database"
import { getAllGuilds } from "@bobaxshop/database"
import { desc, eq } from "drizzle-orm"
import Header from "@/components/layout/Header"
import RecentOrders from "@/components/dashboard/RecentOrders"
import { RevenueFilters } from "@/components/dashboard/RevenueFilters"
import { RevenueStats } from "@/components/dashboard/RevenueStats"
import { GuildFilter } from "@/components/dashboard/GuildFilter"
import { Skeleton } from "@/components/ui/skeleton"

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string; guild?: string }>
}) {
  const params = await searchParams
  const guildId = params.guild || undefined

  const guilds = await getAllGuilds()

  const recentOrders = await db.query.orders.findMany({
    where: guildId ? eq(orders.guildId, guildId) : undefined,
    orderBy: [desc(orders.createdAt)],
    limit: 5,
  })

  const rangeLabel =
    params.preset === "custom" && params.from && params.to
      ? `${params.from} — ${params.to}`
      : { today: "Hari Ini", "7d": "7 Hari Terakhir", "30d": "30 Hari Terakhir", month: "Bulan Ini", all: "Semua Waktu" }[params.preset ?? "7d"] ?? "7 Hari Terakhir"

  return (
    <>
      <Header title="Overview" />
      <main className="flex-1 p-6 space-y-6">
        {/* Filter bar */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Statistik: <span className="text-foreground font-medium">{rangeLabel}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Suspense>
              <RevenueFilters />
            </Suspense>
            <Suspense>
              <GuildFilter guilds={guilds} selected={guildId ?? ""} />
            </Suspense>
          </div>
        </div>

        {/* Stats */}
        <Suspense fallback={<StatsSkeleton />}>
          <RevenueStats preset={params.preset ?? "7d"} from={params.from} to={params.to} guildId={guildId} />
        </Suspense>

        {/* Recent Orders */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Order Terbaru</h2>
          <RecentOrders orders={recentOrders} />
        </div>
      </main>
    </>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  )
}
