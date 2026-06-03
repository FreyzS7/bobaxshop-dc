import { type Client, EmbedBuilder } from 'discord.js'
import { getWaitingPaymentOrders, getGuild, updateOrder, addOrderLog } from '@bobaxshop/database'
import { COLORS, formatIDR, formatRobux } from '@bobaxshop/shared'
import { refreshBuyEmbed } from './stockService'

export async function runAutoCancel(client: Client) {
  const waiting = await getWaitingPaymentOrders()
  console.log(`🕐 Auto-cancel check: ${waiting.length} order(s) waiting_payment`)
  if (waiting.length === 0) return

  const now = Date.now()
  const guildCache = new Map<string, Awaited<ReturnType<typeof getGuild>>>()

  for (const order of waiting) {
    try {
      if (!guildCache.has(order.guildId)) {
        guildCache.set(order.guildId, await getGuild(order.guildId))
      }
      const guild = guildCache.get(order.guildId)
      const expireMinutes = guild?.autoCancelMinutes ?? 360
      const ageMs = now - new Date(order.createdAt).getTime()
      const ageMin = Math.floor(ageMs / 60000)

      console.log(`  → ${order.orderNumber}: umur ${ageMin}m, limit ${expireMinutes}m, akan cancel: ${ageMs >= expireMinutes * 60 * 1000}`)

      if (ageMs < expireMinutes * 60 * 1000) continue

      await updateOrder(order.id, { orderStatus: 'cancelled' })
      await addOrderLog(order.id, 'cancelled', 'system', `Auto-cancelled: tidak ada bukti transfer setelah ${expireMinutes} menit`)

      if (order.pendingChannelId) {
        const discordGuild = client.guilds.cache.get(order.guildId)
        const channel = discordGuild?.channels.cache.get(order.pendingChannelId)
        if (channel) {
          await channel.delete(`Auto-cancel order ${order.orderNumber} (timeout ${expireMinutes}m)`)
        }
        await updateOrder(order.id, { pendingChannelId: null })
      }

      // Kirim DM ke buyer
      try {
        const buyer = await client.users.fetch(order.buyerId)
        const embed = new EmbedBuilder()
          .setColor(COLORS.error)
          .setTitle('❌ Order Dibatalkan Otomatis')
          .setDescription(
            `Order kamu **${order.orderNumber}** telah dibatalkan secara otomatis karena tidak ada pembayaran dalam **${expireMinutes} menit**.\n\n` +
            `Jika ingin melanjutkan, kamu bisa membuat order baru kapan saja.`
          )
          .addFields(
            { name: '💳 Robux', value: formatRobux(order.robuxAmount), inline: true },
            { name: '💰 Total', value: formatIDR(order.priceIdr), inline: true },
            { name: '🔖 Order', value: order.orderNumber, inline: true },
          )
          .setFooter({ text: 'BobaxShop • Auto-cancel system' })
        await buyer.send({ embeds: [embed] })
      } catch {
        // Buyer mungkin menonaktifkan DM — abaikan
      }

      if (order.method === 'transfer') {
        refreshBuyEmbed(client, order.guildId).catch(() => null)
      }

      console.log(`🕐 Auto-cancelled ${order.orderNumber} (buyer: ${order.buyerUsername}, >${expireMinutes}m)`)
    } catch (err) {
      console.error(`  ✗ Gagal cancel ${order.orderNumber}:`, err)
    }
  }
}

export function startAutoCancelScheduler(client: Client) {
  runAutoCancel(client).catch(console.error)
  setInterval(() => runAutoCancel(client).catch(console.error), 60 * 1000) // TODO: set ke 30 * 60 * 1000 setelah testing
}
