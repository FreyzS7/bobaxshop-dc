import { type ModalSubmitInteraction, EmbedBuilder } from 'discord.js'
import { getOrder, updateOrder, addOrderLog } from '@bobaxshop/database'
import { COLORS, formatIDR } from '@bobaxshop/shared'
import { buildAdminActionRow } from '../../services/embedService'
import { requireAdmin } from '../../middleware/isAdmin'
import { refreshBuyEmbed } from '../../services/stockService'

export async function handleCancelReasonModal(
  interaction: ModalSubmitInteraction,
  orderId: string
) {
  if (!(await requireAdmin(interaction))) return

  const reason = interaction.fields.getTextInputValue('cancel_reason').trim()

  await interaction.deferReply({ ephemeral: true })

  const order = await getOrder(orderId)
  if (!order) {
    await interaction.editReply({ content: '❌ Order tidak ditemukan.' })
    return
  }

  if (order.orderStatus === 'completed' || order.orderStatus === 'cancelled' || order.orderStatus === 'refunded') {
    await interaction.editReply({ content: '⚠️ Order ini sudah selesai diproses.' })
    return
  }

  await updateOrder(orderId, { orderStatus: 'cancelled', processedBy: interaction.user.id, notes: reason })
  await addOrderLog(orderId, 'cancelled', interaction.user.id, reason)

  // DM buyer dengan alasan
  try {
    const buyer = await interaction.client.users.fetch(order.buyerId)
    await buyer.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.error)
          .setTitle('❌ Order Dibatalkan')
          .setDescription(
            `Order **${order.orderNumber}** telah dibatalkan oleh admin.\n\n**Alasan:**\n> ${reason}` +
            (order.priceIdr > 0
              ? `\n\nJika kamu sudah membayar **${formatIDR(order.priceIdr)}**, silakan hubungi admin untuk refund.`
              : '')
          ),
      ],
    })
  } catch { /* DM off */ }

  // Hapus pending channel
  const guild = interaction.guild!
  if (order.pendingChannelId) {
    const ch = guild.channels.cache.get(order.pendingChannelId)
    await ch?.delete().catch(() => null)
  }

  // Disable buttons di embed #order
  const { getGuild } = await import('@bobaxshop/database')
  const guildData = await getGuild(guild.id)
  if (order.orderChannelMsgId && guildData?.chOrder) {
    const orderCh = guild.channels.cache.get(guildData.chOrder)
    if (orderCh?.isTextBased()) {
      const msg = await orderCh.messages.fetch(order.orderChannelMsgId).catch(() => null)
      await msg?.edit({ embeds: msg.embeds, components: [buildAdminActionRow(orderId, true)] }).catch(() => null)
    }
  }

  // Log
  if (guildData?.chLogs) {
    const logCh = guild.channels.cache.get(guildData.chLogs)
    if (logCh?.isTextBased()) {
      await logCh.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setDescription(`❌ Order **${order.orderNumber}** dibatalkan oleh <@${interaction.user.id}>\n**Alasan:** ${reason}`),
        ],
      })
    }
  }

  if (order.method === 'transfer') {
    refreshBuyEmbed(interaction.client, order.guildId).catch(() => null)
  }

  await interaction.editReply({ content: `❌ Order **${order.orderNumber}** dibatalkan. Buyer sudah di-DM dengan alasannya.` })
}
