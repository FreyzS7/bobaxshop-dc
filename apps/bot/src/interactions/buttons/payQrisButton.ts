import { type ButtonInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js'
import { COLORS, formatIDR, formatRobux } from '@bobaxshop/shared'
import { updateOrder, getGuild } from '@bobaxshop/database'
import { getPendingOrder, clearPendingOrder } from '../../utils/pendingOrders'
import { createDraftOrder } from '../../services/orderService'
import { createQrisTransaction, fetchQrCodeImage } from '../../services/midtransService'

export async function handlePayQris(interaction: ButtonInteraction) {
  const pending = getPendingOrder(interaction.user.id)
  if (!pending) {
    await interaction.reply({
      content: '❌ Sesi habis. Mulai ulang dari tombol Beli Robux.',
      ephemeral: true,
    })
    return
  }

  await interaction.deferReply({ ephemeral: true })

  try {
    // 1. Buat order di DB
    const order = await createDraftOrder(pending, 'qris')
    clearPendingOrder(interaction.user.id)

    // 2. Buat QRIS transaction di Midtrans
    const qris = await createQrisTransaction(
      order.orderNumber,
      order.priceIdr,
      order.buyerUsername
    )

    // 3. Simpan midtransOrderId + qrCodeUrl ke DB
    await updateOrder(order.id, {
      midtransOrderId: qris.midtransOrderId,
      midtransSnapToken: qris.qrCodeUrl,
    })

    // 4. Fetch QR code image dari Midtrans
    const qrBuffer = await fetchQrCodeImage(qris.qrCodeUrl)
    const attachment = new AttachmentBuilder(qrBuffer, { name: 'qris.png' })

    // 5. Kirim embed + QR code ke user
    const embed = new EmbedBuilder()
      .setColor(COLORS.pending)
      .setTitle(`⏳ Pembayaran QRIS — ${order.orderNumber}`)
      .setDescription(
        'Scan QR Code di bawah menggunakan aplikasi e-wallet atau mobile banking yang mendukung **QRIS**.\n\n' +
        '> GoPay, OVO, DANA, ShopeePay, LinkAja, atau aplikasi bank apapun.'
      )
      .addFields(
        { name: '💰 Total Bayar', value: `**${formatIDR(order.priceIdr)}**`, inline: true },
        { name: '💎 Robux', value: `**${formatRobux(order.robuxAmount)}**`, inline: true },
        { name: '⏱️ Berlaku hingga', value: qris.expiryTime, inline: true },
        { name: '🔖 Order ID', value: order.orderNumber, inline: false },
      )
      .setImage('attachment://qris.png')
      .setFooter({ text: 'BobaxShop • Bayar sebelum waktu habis' })

    // 6. Log ke #logs
    const guild = await getGuild(pending.guildId)
    if (guild?.chLogs) {
      const logsCh = interaction.guild!.channels.cache.get(guild.chLogs)
      if (logsCh?.isTextBased()) {
        await logsCh.send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.info)
              .setDescription(
                `📋 Order baru: **${order.orderNumber}** oleh <@${interaction.user.id}> — menunggu pembayaran QRIS`
              ),
          ],
        })
      }
    }

    await interaction.editReply({ embeds: [embed], files: [attachment] })
  } catch (err) {
    console.error('❌ Error creating QRIS order:', err)
    await interaction.editReply({
      content: '❌ Gagal membuat transaksi QRIS. Coba beberapa saat lagi.',
    })
  }
}
