import { type ModalSubmitInteraction, EmbedBuilder } from 'discord.js'
import { getOrder, updateOrder, addOrderLog } from '@bobaxshop/database'
import { COLORS, formatIDR } from '@bobaxshop/shared'
import { buildAdminActionRow } from '../../services/embedService'
import { requireAdmin } from '../../middleware/isAdmin'

export async function handleRefundReasonModal(
  interaction: ModalSubmitInteraction,
  orderId: string
) {
  if (!(await requireAdmin(interaction))) return

  const notes = interaction.fields.getTextInputValue('refund_reason').trim()

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

  await updateOrder(orderId, { orderStatus: 'refunded', processedBy: interaction.user.id, notes })
  await addOrderLog(orderId, 'refunded', interaction.user.id, notes)

  // DM buyer
  try {
    const buyer = await interaction.client.users.fetch(order.buyerId)
    await buyer.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.info)
          .setTitle('💰 Refund Diproses')
          .setDescription(
            `Refund untuk order **${order.orderNumber}** (${formatIDR(order.priceIdr)}) sedang diproses oleh admin.\n\n**Catatan dari admin:**\n> ${notes}`
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

  // Log ke #logs
  if (guildData?.chLogs) {
    const logCh = guild.channels.cache.get(guildData.chLogs)
    if (logCh?.isTextBased()) {
      await logCh.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.info)
            .setDescription(`💰 Refund order **${order.orderNumber}** diproses oleh <@${interaction.user.id}>\n**Catatan:** ${notes}`),
        ],
      })
    }
  }

  await interaction.editReply({ content: `💰 Refund **${order.orderNumber}** sedang diproses. Buyer sudah di-DM.` })
}
