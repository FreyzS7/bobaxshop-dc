import {
  type ButtonInteraction,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js'
import { COLORS, formatIDR, formatRobux } from '@bobaxshop/shared'
import { updateOrder, getGuild } from '@bobaxshop/database'
import { getEnv } from '@bobaxshop/config'
import { getPendingOrder, clearPendingOrder } from '../../utils/pendingOrders'
import { createDraftOrder } from '../../services/orderService'
import { createQrisTransaction, fetchQrCodeImage } from '../../services/midtransService'
import { refreshBuyEmbed } from '../../services/stockService'
import { resolve } from 'path'

const QRIS_STATIC_PATH = resolve(__dirname, '../../../../../packages/shared/assets/qrisscan.png')

export async function handlePayQris(interaction: ButtonInteraction) {
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
      // ── MODE MIDTRANS ────────────────────────────────────────────────────
      const qris = await createQrisTransaction(order.orderNumber, order.priceIdr, order.buyerUsername)
      await updateOrder(order.id, {
        midtransOrderId: qris.midtransOrderId,
        midtransSnapToken: qris.qrCodeUrl,
      })

      const qrBuffer = await fetchQrCodeImage(qris.qrCodeUrl)
      const attachment = new AttachmentBuilder(qrBuffer, { name: 'qris.png' })

      const isSandbox = !getEnv().MIDTRANS_IS_PRODUCTION
      const embed = new EmbedBuilder()
        .setColor(COLORS.pending)
        .setTitle(`⏳ Pembayaran QRIS — ${order.orderNumber}`)
        .setDescription('Scan QR Code di bawah menggunakan aplikasi e-wallet atau mobile banking yang mendukung **QRIS**.')
        .addFields(
          { name: '💰 Total Bayar', value: `**${formatIDR(order.priceIdr)}**`, inline: true },
          { name: '💳 Robux', value: `**${formatRobux(order.robuxAmount)}**`, inline: true },
          { name: '⏱️ Berlaku hingga', value: qris.expiryTime, inline: true },
          { name: '🔖 Order ID', value: order.orderNumber, inline: false },
          ...(isSandbox && qris.qrString
            ? [{ name: '🧪 Sandbox — QR String', value: `\`\`\`${qris.qrString}\`\`\`Simulator: https://simulator.sandbox.midtrans.com/qris/index`, inline: false }]
            : []),
        )
        .setImage('attachment://qris.png')
        .setFooter({ text: isSandbox ? 'BobaxShop • SANDBOX MODE' : 'BobaxShop • Bayar sebelum waktu habis' })

      await interaction.editReply({ embeds: [embed], files: [attachment] })

    } else {
      // ── MODE MANUAL ──────────────────────────────────────────────────────
      const attachment = new AttachmentBuilder(guild?.qrisImageUrl ?? QRIS_STATIC_PATH, { name: 'qris.png' })

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

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_proof:${order.id}`)
          .setLabel('✅ Sudah Transfer')
          .setStyle(ButtonStyle.Success)
      )

      await interaction.editReply({ embeds: [embed], files: [attachment], components: [row] })
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('❌ Error creating QRIS order:', err)
    await interaction.editReply({ content: `❌ Gagal membuat order.\n\`\`\`${msg}\`\`\`` })
  }
}
