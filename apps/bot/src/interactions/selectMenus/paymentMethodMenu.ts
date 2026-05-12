import { type StringSelectMenuInteraction, EmbedBuilder } from 'discord.js'
import { COLORS } from '@bobaxshop/shared'
import { getPendingOrder, clearPendingOrder } from '../../utils/pendingOrders'
import { createDraftOrder } from '../../services/orderService'
import { buildWaitingPaymentEmbed } from '../../services/embedService'
import { handlePaymentSuccess } from '../../services/paymentCallbackService'
import { getGuild } from '@bobaxshop/database'

// MOCK: delay sebelum auto-complete payment (hapus saat Midtrans sudah aktif)
const MOCK_PAYMENT_DELAY_MS = 15_000 // 15 detik

export async function handlePaymentMethodSelect(interaction: StringSelectMenuInteraction) {
  const pending = getPendingOrder(interaction.user.id)
  if (!pending) {
    await interaction.reply({ content: '❌ Sesi habis. Mulai ulang dari tombol Beli Robux.', ephemeral: true })
    return
  }

  const paymentMethod = interaction.values[0]
  await interaction.deferReply({ ephemeral: true })

  try {
    const order = await createDraftOrder(pending, paymentMethod)
    clearPendingOrder(interaction.user.id)

    // Log ke #logs
    const guild = await getGuild(pending.guildId)
    if (guild?.chLogs) {
      const logsChannel = interaction.guild!.channels.cache.get(guild.chLogs)
      if (logsChannel?.isTextBased()) {
        await logsChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.info)
              .setDescription(`📋 Order baru dibuat: **${order.orderNumber}** oleh <@${interaction.user.id}>`),
          ],
        })
      }
    }

    await interaction.editReply({
      embeds: [buildWaitingPaymentEmbed(order, paymentMethod)],
    })

    // MOCK: auto-complete payment setelah delay
    console.log(`🧪 [MOCK] Payment akan dikonfirmasi dalam ${MOCK_PAYMENT_DELAY_MS / 1000}s untuk order ${order.orderNumber}`)
    setTimeout(() => {
      handlePaymentSuccess(interaction.client, order.id).catch((err) =>
        console.error('❌ [MOCK] handlePaymentSuccess error:', err)
      )
    }, MOCK_PAYMENT_DELAY_MS)

  } catch (err) {
    console.error('❌ Error creating order:', err)
    await interaction.editReply({ content: '❌ Gagal membuat order. Coba lagi.' })
  }
}
