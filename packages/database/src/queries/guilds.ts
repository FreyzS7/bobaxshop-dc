import { eq, inArray } from 'drizzle-orm'
import { db } from '../client'
import { guilds, admins, orders, orderLogs } from '../schema'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type Guild = InferSelectModel<typeof guilds>
export type NewGuild = InferInsertModel<typeof guilds>

export async function getAllGuilds() {
  return db.query.guilds.findMany({
    columns: { id: true, name: true },
  })
}

export async function getGuild(guildId: string) {
  return db.query.guilds.findFirst({
    where: eq(guilds.id, guildId),
  })
}

export async function upsertGuild(data: NewGuild) {
  await db
    .insert(guilds)
    .values(data)
    .onDuplicateKeyUpdate({ set: { name: data.name, updatedAt: new Date() } })
  return db.query.guilds.findFirst({ where: eq(guilds.id, data.id) })
}

export async function updateGuild(guildId: string, data: Partial<Guild>) {
  await db
    .update(guilds)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(guilds.id, guildId))
  return db.query.guilds.findFirst({ where: eq(guilds.id, guildId) })
}

export async function deleteGuild(guildId: string) {
  const guildOrders = await db.query.orders.findMany({
    where: eq(orders.guildId, guildId),
    columns: { id: true },
  })

  if (guildOrders.length > 0) {
    const orderIds = guildOrders.map((o) => o.id)
    await db.delete(orderLogs).where(inArray(orderLogs.orderId, orderIds))
    await db.delete(orders).where(eq(orders.guildId, guildId))
  }

  await db.delete(admins).where(eq(admins.guildId, guildId))
  await db.delete(guilds).where(eq(guilds.id, guildId))
}
