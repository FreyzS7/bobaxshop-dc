import { Events, type Client } from 'discord.js'
import { upsertGuild } from '@bobaxshop/database'

export const name = Events.ClientReady
export const once = true

export async function execute(client: Client) {
  // Sync semua guild yang sudah ada
  for (const guild of client.guilds.cache.values()) {
    await upsertGuild({ id: guild.id, name: guild.name })
  }
  console.log(`✅ Bot online sebagai ${client.user?.tag} (${client.guilds.cache.size} server)`)
}
