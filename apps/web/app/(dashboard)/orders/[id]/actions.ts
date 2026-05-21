"use server"

import { db, orders, orderLogs } from "@bobaxshop/database"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

export async function deleteOrder(orderId: string) {
  // Hapus logs dulu (foreign key), lalu order
  await db.delete(orderLogs).where(eq(orderLogs.orderId, orderId))
  await db.delete(orders).where(eq(orders.id, orderId))
  redirect("/orders")
}
