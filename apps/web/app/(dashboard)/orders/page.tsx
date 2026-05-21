import { db, orders } from "@bobaxshop/database"
import { desc, eq, count } from "drizzle-orm"
import Header from "@/components/layout/Header"
import Link from "next/link"
import { Suspense } from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { Pagination } from "@/components/ui/pagination"
import { OrderFilters } from "./OrderFilters"
import { formatIDR } from "@bobaxshop/shared"

const PAGE_SIZE = 10

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const offset = (page - 1) * PAGE_SIZE
  const statusFilter = params.status as typeof orders.$inferSelect.orderStatus | undefined

  const where = statusFilter ? eq(orders.orderStatus, statusFilter) : undefined

  const [rows, [{ total }]] = await Promise.all([
    db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      limit: PAGE_SIZE,
      offset,
      where,
    }),
    db.select({ total: count() }).from(orders).where(where),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildHref(p: number) {
    const sp = new URLSearchParams()
    if (statusFilter) sp.set("status", statusFilter)
    if (p > 1) sp.set("page", String(p))
    const q = sp.toString()
    return `/orders${q ? `?${q}` : ""}`
  }

  return (
    <>
      <Header title="Orders" />
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-4">
        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <Suspense>
            <OrderFilters />
          </Suspense>
          <span className="text-muted-foreground text-xs shrink-0">
            {total} order
          </span>
        </div>

        {/* Table */}
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Order #</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead className="hidden sm:table-cell">Metode</TableHead>
                <TableHead className="hidden sm:table-cell">Robux</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    Tidak ada order ditemukan.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((order) => (
                <TableRow key={order.id} className="border-border">
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-primary hover:underline text-sm font-mono"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-foreground text-sm">{order.buyerUsername}</TableCell>
                  <TableCell className="text-muted-foreground text-sm capitalize hidden sm:table-cell">
                    {order.method}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                    {order.robuxAmount.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-foreground text-sm">{formatIDR(order.priceIdr)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.orderStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs hidden md:table-cell">
                    {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">
            Halaman {page} dari {totalPages || 1}
          </span>
          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </main>
    </>
  )
}
