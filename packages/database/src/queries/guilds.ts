import { eq } from 'drizzle-orm'
import { db } from '../client'
import { guilds } from '../schema'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type Guild = InferSelectModel<typeof guilds>
export type NewGuild = InferInsertModel<typeof guilds>

export async function getGuild(guildId: string) {
  return db.query.guilds.findFirst({
    where: eq(guilds.id, guildId),
  })
}

export async function upsertGuild(data: NewGuild) {
  const [guild] = await db
    .insert(guilds)
    .values(data)
    .onConflictDoUpdate({
      target: guilds.id,
      set: { name: data.name, updatedAt: new Date() },
    })
    .returning()
  return guild
}

export async function updateGuild(guildId: string, data: Partial<Guild>) {
  const [guild] = await db
    .update(guilds)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(guilds.id, guildId))
    .returning()
  return guild
}
