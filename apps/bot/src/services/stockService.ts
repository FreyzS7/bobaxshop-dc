import { type Client } from 'discord.js'
import { getGuild, updateGuild, getTodayTransferRobuxUsed } from '@bobaxshop/database'
import { buildBuyEmbed, buildBuyButtonRow } from './embedService'

/**
 * Hitung sisa stok transfer hari ini untuk sebuah guild.
 * Kembalikan null jika tidak ada limit (fitur tidak aktif).
 */
export async function getTransferStock(guildId: string): Promise<{ used: number; limit: number; remaining: number } | null> {
  const guild = await getGuild(guildId)
  if (!guild?.transferDailyLimit || !guild.enableTransfer) return null

  const used = await getTodayTransferRobuxUsed(guildId)
  const remaining = Math.max(0, guild.transferDailyLimit - used)
  return { used, limit: guild.transferDailyLimit, remaining }
}

/**
 * Edit buy embed di channel #buy dengan info stok terkini.
 * Dipanggil setiap kali order transfer dibuat atau dibatalkan.
 */
export async function refreshBuyEmbed(client: Client, guildId: string) {
  try {
    const guild = await getGuild(guildId)
    if (!guild?.chBuy || !guild.buyMessageId || !guild.robuxRate) return

    const discordGuild = client.guilds.cache.get(guildId)
    if (!discordGuild) return

    const buyChannel = discordGuild.channels.cache.get(guild.chBuy)
    if (!buyChannel?.isTextBased()) return

    const msg = await buyChannel.messages.fetch(guild.buyMessageId).catch(() => null)
    if (!msg) return

    const enabled = {
      community: guild.enableCommunity ?? true,
      gamepass: guild.enableGamepass ?? true,
      transfer: guild.enableTransfer ?? false,
    }

    let transferRemaining: number | undefined
    if (enabled.transfer && guild.transferDailyLimit) {
      const used = await getTodayTransferRobuxUsed(guildId)
      transferRemaining = Math.max(0, guild.transferDailyLimit - used)
    }

    await msg.edit({
      embeds: [buildBuyEmbed(
        Number(guild.robuxRate),
        guild.minRobux ?? 1000,
        guild.stepRobux ?? 500,
        guild.robuxRateGamepass ? Number(guild.robuxRateGamepass) : undefined,
        guild.robuxRateTransfer ? Number(guild.robuxRateTransfer) : undefined,
        enabled,
        transferRemaining,
      )],
      components: [buildBuyButtonRow()],
    })
  } catch (err) {
    console.error('[refreshBuyEmbed] error:', err)
  }
}
