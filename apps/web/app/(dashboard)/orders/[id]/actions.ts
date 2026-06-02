"use server"

import { db, orders, orderLogs } from "@bobaxshop/database"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function deleteOrder(orderId: string) {
  await db.delete(orderLogs).where(eq(orderLogs.orderId, orderId))
  await db.delete(orders).where(eq(orders.id, orderId))
  redirect("/orders")
}

export async function updateOrderWeb(
  orderId: string,
  data: {
    orderStatus?: string
    paymentStatus?: string
    robloxUsername?: string
    priceIdr?: number
    robuxAmount?: number
    note?: string
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (data.orderStatus) updates.orderStatus = data.orderStatus
    if (data.paymentStatus) updates.paymentStatus = data.paymentStatus
    if (data.robloxUsername !== undefined) updates.robloxUsername = data.robloxUsername || null
    if (data.priceIdr !== undefined && data.priceIdr > 0) updates.priceIdr = data.priceIdr
    if (data.robuxAmount !== undefined && data.robuxAmount > 0) updates.robuxAmount = data.robuxAmount

    await db.update(orders).set(updates).where(eq(orders.id, orderId))

    if (data.note?.trim()) {
      await db.insert(orderLogs).values({
        orderId,
        action: "edited",
        actor: "web-admin",
        note: data.note.trim(),
      })
    }

    revalidatePath(`/orders/${orderId}`)
    return { success: true, message: "Order berhasil diupdate." }
  } catch {
    return { success: false, message: "Gagal mengupdate order." }
  }
}
