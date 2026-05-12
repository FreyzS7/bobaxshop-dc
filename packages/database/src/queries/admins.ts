import { eq, and } from 'drizzle-orm'
import { db } from '../client'
import { admins } from '../schema'
import type { InferInsertModel } from 'drizzle-orm'

export type NewAdmin = InferInsertModel<typeof admins>

export async function getAdmins(guildId: string) {
  return db.query.admins.findMany({
    where: eq(admins.guildId, guildId),
  })
}

export async function isAdmin(guildId: string, discordUserId: string) {
  const admin = await db.query.admins.findFirst({
    where: and(eq(admins.guildId, guildId), eq(admins.discordUserId, discordUserId)),
  })
  return !!admin
}

export async function addAdmin(data: NewAdmin) {
  const [admin] = await db.insert(admins).values(data).returning()
  return admin
}

export async function removeAdmin(guildId: string, discordUserId: string) {
  await db
    .delete(admins)
    .where(and(eq(admins.guildId, guildId), eq(admins.discordUserId, discordUserId)))
}
