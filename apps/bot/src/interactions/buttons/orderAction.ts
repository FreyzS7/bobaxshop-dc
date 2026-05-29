import { type ButtonInteraction, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js'
import { getOrder, updateOrder, addOrderLog } from '@bobaxshop/database'
import { COLORS, formatRobux, formatIDR } from '@bobaxshop/shared'
import { buildAdminActionRow } from '../../services/embedService'
import { requireAdmin } from '../../middleware/isAdmin'

export async function handleOrderAction(
  interaction: ButtonInteraction,
  action: 'done' | 'pending' | 'cancel' | 'refund' | 'invalid_proof',
  orderId: string
) {
  if (!(await requireAdmin(interaction))) return

  // Cancel: tampilkan modal untuk alasan pembatalan (sebelum defer)
  if (action === 'cancel') {
    const modal = new ModalBuilder()
      .setCustomId(`modal_cancel_reason:${orderId}`)
      .setTitle('❌ Alasan Pembatalan')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('cancel_reason')
            .setLabel('Alasan cancel order ini')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Contoh: Akun Roblox belum bergabung group minimal 5 hari')
            .setMinLength(5)
            .setMaxLength(500)
            .setRequired(true)
        )
      )
    await interaction.showModal(modal)
    return
  }

  // Refund: tampilkan modal untuk catatan refund (sebelum defer)
  if (action === 'refund') {
    const modal = new ModalBuilder()
      .setCustomId(`modal_refund_reason:${orderId}`)
      .setTitle('💰 Proses Refund')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('refund_reason')
            .setLabel('Catatan refund')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Contoh: Transfer balik sudah dikirim ke rekening 1234xxxx')
            .setMinLength(5)
            .setMaxLength(500)
            .setRequired(true)
        )
      )
    await interaction.showModal(modal)
    return
  }

  // Invalid proof: tampilkan modal untuk alasan (sebelum defer)
  if (action === 'invalid_proof') {
    const modal = new ModalBuilder()
      .setCustomId(`modal_invalid_proof:${orderId}`)
      .setTitle('🚫 Bukti Transfer Invalid')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('invalid_reason')
            .setLabel('Alasan bukti tidak valid')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Contoh: Nominal tidak sesuai, screenshot tidak jelas, bukan bukti transfer QRIS')
            .setMinLength(5)
            .setMaxLength(300)
            .setRequired(true)
        )
      )
    await interaction.showModal(modal)
    return
  }

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

  const guild = interaction.guild!

  if (action === 'done') {
    await updateOrder(orderId, { orderStatus: 'completed', processedBy: interaction.user.id })
    await addOrderLog(orderId, 'completed', interaction.user.id, 'Order diselesaikan oleh admin')

    // DM buyer
    try {
      const buyer = await interaction.client.users.fetch(order.buyerId)
      await buyer.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setTitle('✅ Order Selesai!')
            .setDescription(
              `Order **${order.orderNumber}** telah selesai!\n**${formatRobux(order.robuxAmount)} Robux** sudah dikirim.\n\nTerima kasih sudah berbelanja di BobaxShop! 💎`
            ),
        ],
      })
    } catch { /* buyer mungkin DM off */ }

    // Hapus pending channel
    if (order.pendingChannelId) {
      const ch = guild.channels.cache.get(order.pendingChannelId)
      await ch?.delete().catch(() => null)
    }

    // Disable buttons di embed #order
    await disableOrderEmbed(interaction, order.orderChannelMsgId)

    // Log admin
    await sendLog(interaction, `✅ Order **${order.orderNumber}** diselesaikan oleh <@${interaction.user.id}>`, COLORS.success)

    // Payment log (public)
    await sendPaymentLog(interaction, order)

    await interaction.editReply({ content: `✅ Order **${order.orderNumber}** ditandai selesai.` })

  } else if (action === 'pending') {
    await updateOrder(orderId, { orderStatus: 'processing' })
    await addOrderLog(orderId, 'processing', interaction.user.id, 'Ditandai pending oleh admin')

    try {
      const buyer = await interaction.client.users.fetch(order.buyerId)
      await buyer.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.warning)
            .setDescription(`⏳ Order **${order.orderNumber}** sedang diproses oleh admin. Harap tunggu.`),
        ],
      })
    } catch { /* DM off */ }

    await sendLog(interaction, `⏳ Order **${order.orderNumber}** di-pending oleh <@${interaction.user.id}>`, COLORS.warning)
    await interaction.editReply({ content: `⏳ Order **${order.orderNumber}** ditandai pending.` })

  }
}

async function disableOrderEmbed(interaction: ButtonInteraction, msgId: string | null) {
  if (!msgId) return
  const order = await getOrder(((interaction.message.components[0] as any)?.components?.[0] as any)?.customId?.split(':')[1])
  try {
    await interaction.message.edit({
      embeds: interaction.message.embeds,
      components: [buildAdminActionRow(order?.id ?? '', true)],
    })
  } catch { /* message mungkin sudah dihapus */ }
}

async function sendLog(interaction: ButtonInteraction, text: string, color: number) {
  const { getGuild } = await import('@bobaxshop/database')
  const guild = await getGuild(interaction.guild!.id)
  if (!guild?.chLogs) return
  const ch = interaction.guild!.channels.cache.get(guild.chLogs)
  if (ch?.isTextBased()) {
    await ch.send({ embeds: [new EmbedBuilder().setColor(color).setDescription(text)] })
  }
}

async function sendPaymentLog(interaction: ButtonInteraction, order: Awaited<ReturnType<typeof getOrder>>) {
  if (!order) return
  const { getGuild } = await import('@bobaxshop/database')
  const guild = await getGuild(interaction.guild!.id)
  if (!guild?.chPaymentLog) return
  const ch = interaction.guild!.channels.cache.get(guild.chPaymentLog)
  if (!ch?.isTextBased()) return

  const methodLabel: Record<string, string> = {
    community: 'Community Join',
    gamepass: 'Gamepass',
    transfer: 'Robux Transfer',
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.success)
    .setDescription(
      `\`${order.buyerId}\` baru saja melakukan transaksi pembelian **${formatRobux(order.robuxAmount)} Robux** ` +
      `via **${methodLabel[order.method] ?? order.method}** ` +
      `sebesar **${formatIDR(order.priceIdr)}**`
    )
    .setFooter({ text: order.orderNumber })
    .setTimestamp()

  await ch.send({ embeds: [embed] }).catch(() => null)
}
