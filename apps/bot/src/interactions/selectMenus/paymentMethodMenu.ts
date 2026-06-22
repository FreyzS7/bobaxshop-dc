import {
  type StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from 'discord.js'
import { COLORS, formatIDR, formatRobux } from '@bobaxshop/shared'
import { getPendingOrder, clearPendingOrder } from '../../utils/pendingOrders'
import { createDraftOrder } from '../../services/orderService'
import { getGuild, updateOrder } from '@bobaxshop/database'
import { createQrisTransaction, fetchQrCodeImage } from '../../services/midtransService'
import { refreshBuyEmbed } from '../../services/stockService'
import { getQrisAttachment } from '../../utils/qrisHelper'

export async function handlePaymentMethodSelect(interaction: StringSelectMenuInteraction) {
  const pending = getPendingOrder(interaction.user.id)
  if (!pending) {
    await interaction.reply({ content: '❌ Sesi habis. Mulai ulang dari tombol Beli Robux.', ephemeral: true })
    return
  }

  await interaction.deferReply({ ephemeral: true })

  try {
    const guild = await getGuild(pending.guildId)
    const paymentMode = guild?.paymentMode ?? 'manual'

    const order = await createDraftOrder(pending, paymentMode === 'midtrans' ? 'qris' : 'qris_manual')
    if (!order) throw new Error('Gagal menyimpan order ke database.')
    clearPendingOrder(interaction.user.id)

    // Refresh buy embed jika metode transfer (stok berkurang)
    if (pending.method === 'transfer') {
      refreshBuyEmbed(interaction.client, pending.guildId).catch(() => null)
    }

    // Log ke #logs
    if (guild?.chLogs) {
      const logsCh = interaction.guild!.channels.cache.get(guild.chLogs)
      if (logsCh?.isTextBased()) {
        await logsCh.send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.info)
              .setDescription(`📋 Order baru: **${order.orderNumber}** oleh <@${interaction.user.id}>`),
          ],
        })
      }
    }

    if (paymentMode === 'midtrans') {
      // ── MODE MIDTRANS ──────────────────────────────────────────────────────
      const qris = await createQrisTransaction(order.orderNumber, order.priceIdr, order.buyerUsername)

      await updateOrder(order.id, {
        midtransOrderId: qris.midtransOrderId,
        midtransSnapToken: qris.qrCodeUrl,
      })

      const qrBuffer = await fetchQrCodeImage(qris.qrCodeUrl)
      const attachment = new AttachmentBuilder(qrBuffer, { name: 'qris.png' })

      const embed = new EmbedBuilder()
        .setColor(COLORS.pending)
        .setTitle(`⏳ Pembayaran QRIS — ${order.orderNumber}`)
        .setDescription(
          'Scan QR Code di bawah menggunakan aplikasi e-wallet atau mobile banking yang mendukung **QRIS**.'
        )
        .addFields(
          { name: '💰 Total Bayar', value: `**${formatIDR(order.priceIdr)}**`, inline: true },
          { name: '💳 Robux', value: `**${formatRobux(order.robuxAmount)}**`, inline: true },
          { name: '⏱️ Berlaku hingga', value: qris.expiryTime, inline: true },
          { name: '🔖 Order ID', value: order.orderNumber, inline: false },
        )
        .setImage('attachment://qris.png')
        .setFooter({ text: 'BobaxShop • Bayar sebelum waktu habis' })

      await interaction.editReply({ embeds: [embed], files: [attachment] })

    } else {
      // ── MODE MANUAL ────────────────────────────────────────────────────────
      const attachment = await getQrisAttachment(interaction.client, guild)

      const embed = new EmbedBuilder()
        .setColor(COLORS.pending)
        .setTitle(`💳 Pembayaran QRIS — ${order.orderNumber}`)
        .setDescription(
          'Scan QR Code di bawah menggunakan aplikasi e-wallet atau mobile banking yang mendukung **QRIS**.\n\n' +
          '> GoPay, OVO, DANA, ShopeePay, LinkAja, atau aplikasi bank apapun.\n\n' +
          '**Setelah transfer sesuai nominal, klik tombol ✅ Sudah Transfer di bawah.**'
        )
        .addFields(
          { name: '💰 Total Bayar', value: `**${formatIDR(order.priceIdr)}**`, inline: true },
          { name: '💳 Robux', value: `**${formatRobux(order.robuxAmount)}**`, inline: true },
          { name: '🔖 Order ID', value: order.orderNumber, inline: false },
        )
        .setImage('attachment://qris.png')
        .setFooter({ text: 'BobaxShop • Bayar sesuai nominal di atas' })

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_proof:${order.id}`)
          .setLabel('✅ Sudah Transfer')
          .setStyle(ButtonStyle.Success)
      )

      await interaction.editReply({ embeds: [embed], files: [attachment], components: [row] })
    }

  } catch (err) {
    console.error('❌ Error creating order:', err)
    const msg = err instanceof Error ? err.message : String(err)
    await interaction.editReply({ content: `❌ Gagal membuat order.\n\`\`\`${msg}\`\`\`` })
  }
}
