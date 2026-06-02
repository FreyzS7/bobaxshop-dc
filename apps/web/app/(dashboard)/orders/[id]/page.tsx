import { db } from "@bobaxshop/database"
import { orders, orderLogs } from "@bobaxshop/database"
import { eq, asc } from "drizzle-orm"
import { notFound } from "next/navigation"
import Header from "@/components/layout/Header"
import { formatIDR } from "@bobaxshop/shared"
import { Separator } from "@/components/ui/separator"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { DeleteOrderButton } from "./DeleteOrderButton"
import { EditOrderForm } from "./EditOrderForm"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [order, logs] = await Promise.all([
    db.query.orders.findFirst({ where: eq(orders.id, id) }),
    db.query.orderLogs.findMany({
      where: eq(orderLogs.orderId, id),
      orderBy: [asc(orderLogs.createdAt)],
    }),
  ])

  if (!order) notFound()

  return (
    <>
      <Header title={`Order ${order.orderNumber}`} />
      <main className="flex-1 p-6 max-w-3xl space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-white font-semibold text-lg">{order.orderNumber}</h2>
              <OrderStatusBadge status={order.orderStatus} />
            </div>
            <div className="flex items-center gap-2">
              <EditOrderForm
                orderId={order.id}
                current={{
                  orderStatus: order.orderStatus,
                  paymentStatus: order.paymentStatus,
                  robloxUsername: order.robloxUsername ?? null,
                  priceIdr: order.priceIdr,
                  robuxAmount: order.robuxAmount,
                }}
              />
              <DeleteOrderButton orderId={order.id} orderNumber={order.orderNumber} />
            </div>
          </div>
          <Separator className="bg-zinc-800" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Buyer" value={`${order.buyerUsername} (${order.buyerId})`} />
            <Info label="Metode" value={order.method} />
            <Info label="Robux (net)" value={order.robuxAmount.toLocaleString("id-ID")} />
            <Info label="Robux (gross)" value={order.robuxGross.toLocaleString("id-ID")} />
            {order.gamepassLink && <Info label="Gamepass" value={order.gamepassLink} />}
            <Info label="Total Bayar" value={formatIDR(order.priceIdr)} />
            <Info label="Payment" value={order.paymentMethod} />
            <Info label="Payment Status" value={order.paymentStatus} />
            {order.processedBy && <Info label="Diproses oleh" value={order.processedBy} />}
            <Info label="Dibuat" value={new Date(order.createdAt).toLocaleString("id-ID")} />
          </div>
        </div>

        {order.proofImageUrl && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
            <h3 className="text-zinc-400 text-sm font-medium">Bukti Transfer</h3>
            <a href={order.proofImageUrl} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.proofImageUrl}
                alt="Bukti Transfer"
                className="rounded-md max-h-96 object-contain border border-zinc-700 cursor-zoom-in"
              />
            </a>
          </div>
        )}

        <div>
          <h3 className="text-zinc-400 text-sm font-medium mb-3">Timeline</h3>
          <div className="space-y-3">
            {logs.length === 0 && (
              <p className="text-zinc-600 text-sm">Belum ada log.</p>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 text-sm">
                <div className="w-1 bg-zinc-700 rounded-full shrink-0" />
                <div>
                  <span className="text-white font-medium">{log.action}</span>
                  {log.actor && <span className="text-zinc-500 ml-2">by {log.actor}</span>}
                  {log.note && <p className="text-zinc-400 mt-0.5">{log.note}</p>}
                  <p className="text-zinc-600 text-xs mt-0.5">
                    {new Date(log.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className="text-zinc-200 mt-0.5 break-all">{value}</p>
    </div>
  )
}
