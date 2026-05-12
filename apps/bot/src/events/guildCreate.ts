import { Events, type Guild } from 'discord.js'
import { upsertGuild } from '@bobaxshop/database'

export const name = Events.GuildCreate
export const once = false

export async function execute(guild: Guild) {
  await upsertGuild({ id: guild.id, name: guild.name })
  console.log(`✅ Guild terdaftar: ${guild.name} (${guild.id})`)
}
