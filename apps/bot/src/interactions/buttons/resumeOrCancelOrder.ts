import {
  type ButtonInteraction,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js'
import { getOrder, updateOrder, addOrderLog, getGuild } from '@bobaxshop/database'
import { COLORS, formatIDR, formatRobux } from '@bobaxshop/shared'
import { showRobuxAmountModal } from './methodSelect'
import { fetchQrCodeImage } from '../../services/midtransService'
import { refreshBuyEmbed } from '../../services/stockService'
import { getQrisAttachment } from '../../utils/qrisHelper'

export async function handleResumeOrder(interaction: ButtonInteraction, orderId: string) {
  await interaction.deferReply({ ephemeral: true })

  const order = await getOrder(orderId)
  if (!order || order.orderStatus !== 'waiting_payment') {
    await interaction.editReply({ content: '⚠️ Order tidak ditemukan atau sudah tidak aktif.' })
    return
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`confirm_proof:${order.id}`)
      .setLabel('✅ Sudah Transfer')
      .setStyle(ButtonStyle.Success)
  )

  if (order.paymentMethod === 'qris' && order.midtransSnapToken) {
    // Midtrans — re-fetch QR dari URL yang tersimpan
    try {
      const qrBuffer = await fetchQrCodeImage(order.midtransSnapToken)
      const attachment = new AttachmentBuilder(qrBuffer, { name: 'qris.png' })

      const embed = new EmbedBuilder()
        .setColor(COLORS.pending)
        .setTitle(`⏳ Pembayaran QRIS — ${order.orderNumber}`)
        .setDescription('Scan QR Code di bawah menggunakan aplikasi e-wallet atau mobile banking yang mendukung **QRIS**.')
        .addFields(
          { name: '💰 Total Bayar', value: `**${formatIDR(order.priceIdr)}**`, inline: true },
          { name: '💳 Robux', value: `**${formatRobux(order.robuxAmount)}**`, inline: true },
          { name: '🔖 Order ID', value: order.orderNumber, inline: false },
        )
        .setImage('attachment://qris.png')
        .setFooter({ text: 'BobaxShop • Bayar sebelum waktu habis' })

      await interaction.editReply({ embeds: [embed], files: [attachment], components: [row] })
    } catch {
      await interaction.editReply({ content: '❌ Gagal memuat QR Code. Hubungi admin.' })
    }
  } else {
    // Manual QRIS
    const guild = await getGuild(order.guildId)
    const attachment = await getQrisAttachment(interaction.client, guild)

    const embed = new EmbedBuilder()
      .setColor(COLORS.pending)
      .setTitle(`💳 Pembayaran QRIS — ${order.orderNumber}`)
      .setDescription(
        `Scan QR Code di bawah menggunakan aplikasi e-wallet atau mobile banking yang mendukung **QRIS**.\n` +
        `> GoPay, OVO, DANA, ShopeePay, LinkAja, atau aplikasi bank apapun.\n\n` +
        `⚠️ Silahkan transfer senilai **${formatIDR(order.priceIdr)}**, pastikan nominal sesuai dengan yang sudah ditentukan atau order akan gagal.\n\n` +
        `**Setelah transfer, klik tombol ✅ Sudah Transfer di bawah.**`
      )
      .addFields(
        { name: '💰 Total Bayar', value: `**${formatIDR(order.priceIdr)}**`, inline: true },
        { name: '💳 Robux', value: `**${formatRobux(order.robuxAmount)}**`, inline: true },
        { name: '🔖 Order ID', value: order.orderNumber, inline: false },
      )
      .setImage('attachment://qris.png')
      .setFooter({ text: 'BobaxShop • Bayar sesuai nominal di atas' })

    await interaction.editReply({ embeds: [embed], files: [attachment], components: [row] })
  }
}

export async function handleCancelAndNew(
  interaction: ButtonInteraction,
  oldOrderId: string,
  method: 'gamepass' | 'community' | 'transfer'
) {
  const order = await getOrder(oldOrderId)

  await updateOrder(oldOrderId, { orderStatus: 'cancelled', pendingChannelId: null })
  await addOrderLog(oldOrderId, 'cancelled', interaction.user.id, 'Dibatalkan oleh buyer untuk buat order baru')

  // Hapus pending channel jika ada
  if (order?.pendingChannelId) {
    const channel = interaction.guild?.channels.cache.get(order.pendingChannelId)
    if (channel) {
      await channel.delete(`Order ${order.orderNumber} dibatalkan oleh buyer`).catch(() => null)
    }
  }

  // Refresh buy embed jika order transfer dibatalkan (stok kembali)
  if (order?.method === 'transfer') {
    refreshBuyEmbed(interaction.client, order.guildId).catch(() => null)
  }

  await showRobuxAmountModal(interaction, method)
}
