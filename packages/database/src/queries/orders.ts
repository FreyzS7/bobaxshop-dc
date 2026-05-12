import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../client'
import { orders, orderLogs } from '../schema'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type Order = InferSelectModel<typeof orders>
export type NewOrder = InferInsertModel<typeof orders>

export async function createOrder(data: NewOrder) {
  const [order] = await db.insert(orders).values(data).returning()
  return order
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

export async function updateOrder(orderId: string, data: Partial<Order>) {
  const [order] = await db
    .update(orders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning()
  return order
}

// Untuk bot polling: ambil order paid yang belum diproses
export async function getPendingUnprocessedOrders() {
  return db.query.orders.findMany({
    where: and(eq(orders.orderStatus, 'paid'), isNull(orders.pendingChannelId)),
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
