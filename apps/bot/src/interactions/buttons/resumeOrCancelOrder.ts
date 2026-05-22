import { type ButtonInteraction, EmbedBuilder } from 'discord.js'
import { getOrder, updateOrder, addOrderLog } from '@bobaxshop/database'
import { COLORS, formatIDR, formatRobux } from '@bobaxshop/shared'
import { showRobuxAmountModal } from './methodSelect'

export async function handleResumeOrder(interaction: ButtonInteraction, orderId: string) {
  await interaction.deferReply({ ephemeral: true })

  const order = await getOrder(orderId)
  if (!order || order.orderStatus !== 'waiting_payment') {
    await interaction.editReply({ content: '⚠️ Order tidak ditemukan atau sudah tidak aktif.' })
    return
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('📋 Lanjutkan Pembayaran')
    .setDescription(`Silahkan lanjutkan pembayaran untuk order **${order.orderNumber}**.`)
    .addFields(
      { name: '💳 Robux', value: formatRobux(order.robuxAmount), inline: true },
      { name: '💰 Total', value: formatIDR(order.priceIdr), inline: true },
      { name: '📦 Metode', value: order.method, inline: true },
    )

  await interaction.editReply({ embeds: [embed], content: 'Gunakan tombol **Beli Robux** lagi dan pilih metode yang sama untuk melanjutkan ke pembayaran.' })
}

export async function handleCancelAndNew(
  interaction: ButtonInteraction,
  oldOrderId: string,
  method: 'gamepass' | 'community'
) {
  await updateOrder(oldOrderId, { orderStatus: 'cancelled' })
  await addOrderLog(oldOrderId, 'cancelled', interaction.user.id, 'Dibatalkan oleh buyer untuk buat order baru')

  await showRobuxAmountModal(interaction, method)
}
