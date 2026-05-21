import { type ModalSubmitInteraction, EmbedBuilder } from 'discord.js'
import { getOrder, updateOrder, addOrderLog } from '@bobaxshop/database'
import { COLORS } from '@bobaxshop/shared'
import { requireAdmin } from '../../middleware/isAdmin'

export async function handleInvalidProofModal(
  interaction: ModalSubmitInteraction,
  orderId: string
) {
  if (!(await requireAdmin(interaction))) return

  const reason = interaction.fields.getTextInputValue('invalid_reason').trim()

  await interaction.deferReply({ ephemeral: true })

  const order = await getOrder(orderId)
  if (!order) {
    await interaction.editReply({ content: '❌ Order tidak ditemukan.' })
    return
  }

  // Reset payment status agar buyer bisa kirim bukti baru
  await updateOrder(orderId, { paymentStatus: 'pending', orderStatus: 'waiting_payment' })
  await addOrderLog(orderId, 'proof_rejected', interaction.user.id, reason)

  // Notify buyer di proof channel
  const guild = interaction.guild!
  if (order.pendingChannelId) {
    const proofCh = guild.channels.cache.get(order.pendingChannelId)
    if (proofCh?.isTextBased()) {
      await proofCh.send({
        content: `<@${order.buyerId}>`,
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setTitle('🚫 Bukti Transfer Tidak Valid')
            .setDescription(
              `Bukti transfer yang kamu kirim **tidak valid**.\n\n` +
              `**Alasan dari admin:**\n> ${reason}\n\n` +
              `Silakan kirim ulang bukti transfer yang benar di channel ini.`
            )
            .setFooter({ text: 'Kirim 1 gambar bukti transfer yang jelas' }),
        ],
      }).catch(() => null)
    }
  }

  // Log ke #logs
  const { getGuild } = await import('@bobaxshop/database')
  const guildData = await getGuild(guild.id)
  if (guildData?.chLogs) {
    const logCh = guild.channels.cache.get(guildData.chLogs)
    if (logCh?.isTextBased()) {
      await logCh.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setDescription(`🚫 Bukti transfer **${order.orderNumber}** ditolak oleh <@${interaction.user.id}>\n**Alasan:** ${reason}`),
        ],
      })
    }
  }

  await interaction.editReply({
    content: `🚫 Bukti transfer ditolak. Buyer <@${order.buyerId}> sudah dinotifikasi di channel bukti untuk kirim ulang.`,
  })
}
