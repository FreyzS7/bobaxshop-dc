import { eq, and, isNull, isNotNull } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { db } from '../client'
import { orders, orderLogs } from '../schema'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type Order = InferSelectModel<typeof orders>
export type NewOrder = InferInsertModel<typeof orders>

export async function createOrder(data: NewOrder) {
  const id = data.id ?? randomUUID()
  await db.insert(orders).values({ ...data, id })
  return db.query.orders.findFirst({ where: eq(orders.id, id) })
}

export async function getOrder(orderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })
}

export async function getOrderByNumber(orderNumber: string) {
  return db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber),
  })
}

export async function getOrderByMidtransId(midtransOrderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.midtransOrderId, midtransOrderId),
  })
}

export async function getOrderByPendingChannelId(channelId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.pendingChannelId, channelId),
  })
}

export async function updateOrder(orderId: string, data: Partial<Order>) {
  await db
    .update(orders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
  return db.query.orders.findFirst({ where: eq(orders.id, orderId) })
}

export async function getPendingUnprocessedOrders() {
  return db.query.orders.findMany({
    where: and(eq(orders.orderStatus, 'paid'), isNull(orders.pendingChannelId)),
  })
}

export async function getActiveBuyerOrder(guildId: string, buyerId: string) {
  return db.query.orders.findFirst({
    where: and(
      eq(orders.guildId, guildId),
      eq(orders.buyerId, buyerId),
      eq(orders.orderStatus, 'waiting_payment'),
    ),
  })
}

export async function getActivePendingChannelIds(guildId: string): Promise<string[]> {
  const rows = await db.query.orders.findMany({
    where: and(eq(orders.guildId, guildId), isNotNull(orders.pendingChannelId)),
    columns: { pendingChannelId: true },
  })
  return rows.map((r) => r.pendingChannelId!)
}

export async function getWaitingPaymentOrders() {
  return db.query.orders.findMany({
    where: eq(orders.orderStatus, 'waiting_payment'),
  })
}

export async function addOrderLog(
  orderId: string,
  action: string,
  actor?: string,
  note?: string
) {
  await db.insert(orderLogs).values({ orderId, action, actor, note })
}

export async function getOrderLogs(orderId: string) {
  return db.query.orderLogs.findMany({
    where: eq(orderLogs.orderId, orderId),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  })
}
