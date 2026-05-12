import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { COLORS, formatIDR, formatRobux } from '@bobaxshop/shared'
import type { Order } from '@bobaxshop/database'

export function buildBuyEmbed(robuxRate: number) {
  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('🛒 Beli Robux — BobaxShop')
    .setDescription('Beli Robux dengan harga terpercaya dan aman!\n\nKlik tombol di bawah untuk mulai transaksi.')
    .addFields(
      { name: '💰 Rate Saat Ini', value: `**${formatIDR(robuxRate)}** per Robux`, inline: true },
      { name: '🎮 Metode', value: '• **Via Gamepass** — Buyer buat gamepass\n• **Via Community Join** — Buyer join grup Roblox', inline: false },
      { name: '📌 Ketentuan', value: 'Min. **1.000 Robux** • Kelipatan **500**', inline: false },
    )
    .setFooter({ text: 'BobaxShop • Transaksi aman & terpercaya' })
}

export function buildBuyButtonRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('buy_start')
      .setLabel('🛒 Beli Robux')
      .setStyle(ButtonStyle.Primary)
  )
}

export function buildMethodRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('method_gamepass')
      .setLabel('🎮 Via Gamepass')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('method_community')
      .setLabel('👥 Via Community Join')
      .setStyle(ButtonStyle.Secondary)
  )
}

export function buildGamepassLinkButtonRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('input_gamepass_link')
      .setLabel('🔗 Input Link Gamepass')
      .setStyle(ButtonStyle.Primary)
  )
}

export function buildWaitingPaymentEmbed(order: Order, paymentMethod: string) {
  return new EmbedBuilder()
    .setColor(COLORS.pending)
    .setTitle(`⏳ Menunggu Pembayaran — ${order.orderNumber}`)
    .addFields(
      { name: '🧾 Order ID', value: order.orderNumber, inline: true },
      { name: '🎮 Metode', value: order.method === 'gamepass' ? 'Via Gamepass' : 'Via Community', inline: true },
      { name: '💎 Robux', value: `**${formatRobux(order.robuxAmount)}** Robux`, inline: true },
      ...(order.method === 'gamepass'
        ? [{ name: '🎯 Set Harga Gamepass', value: `**${formatRobux(order.robuxGross)}** Robux (termasuk tax 30%)`, inline: false }]
        : []),
      { name: '💳 Metode Bayar', value: paymentMethod.toUpperCase(), inline: true },
      { name: '💰 Total Bayar', value: `**${formatIDR(order.priceIdr)}**`, inline: true },
      { name: '⏱️ Berlaku', value: '15 menit', inline: true },
    )
    .setFooter({ text: 'Selesaikan pembayaran sebelum waktu habis' })
}

export function buildOrderAdminEmbed(order: Order) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.warning)
    .setTitle(`📦 Order Baru — ${order.orderNumber}`)
    .addFields(
      { name: '👤 Buyer', value: `<@${order.buyerId}> (${order.buyerUsername})`, inline: true },
      { name: '🎮 Metode', value: order.method === 'gamepass' ? 'Via Gamepass' : 'Via Community', inline: true },
      { name: '💎 Robux (net)', value: formatRobux(order.robuxAmount), inline: true },
      { name: '💎 Robux (gross)', value: formatRobux(order.robuxGross), inline: true },
      { name: '💰 Total', value: formatIDR(order.priceIdr), inline: true },
      { name: '💳 Payment', value: `${order.paymentMethod} ✅`, inline: true },
    )

  if (order.robloxUsername) {
    embed.addFields({ name: '👤 Username Roblox', value: order.robloxUsername, inline: false })
  }

  if (order.gamepassLink) {
    embed.addFields({ name: '🔗 Link Gamepass', value: order.gamepassLink, inline: false })
  }

  return embed
}

export function buildAdminActionRow(orderId: string, disabled = false) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`order_done:${orderId}`)
      .setLabel('✅ Selesai')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`order_pending:${orderId}`)
      .setLabel('⏳ Pending')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`order_cancel:${orderId}`)
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled)
  )
}
