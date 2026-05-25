import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { COLORS, formatIDR, formatRobux } from '@bobaxshop/shared'
import type { Order } from '@bobaxshop/database'

export function buildBuyEmbed(
  robuxRate: number,
  minRobux = 1000,
  stepRobux = 500,
  robuxRateGamepass?: number,
  robuxRateTransfer?: number,
  enabledMethods: { community: boolean; gamepass: boolean; transfer: boolean } = { community: true, gamepass: true, transfer: false },
) {
  const rateFields: { name: string; value: string; inline: boolean }[] = []
  if (enabledMethods.community) rateFields.push({ name: '👥 Rate Community', value: `**${formatIDR(robuxRate)}** per Robux`, inline: true })
  if (enabledMethods.gamepass) rateFields.push({ name: '🎮 Rate Gamepass', value: `**${formatIDR(robuxRateGamepass ?? robuxRate)}** per Robux`, inline: true })
  if (enabledMethods.transfer) rateFields.push({ name: '💸 Rate Transfer', value: `**${formatIDR(robuxRateTransfer ?? robuxRate)}** per Robux`, inline: true })

  const methodLines: string[] = []
  if (enabledMethods.gamepass) methodLines.push('• **Via Gamepass** — Buat gamepass di experience Roblox')
  if (enabledMethods.community) methodLines.push('• **Via Community Join** — Join grup Roblox')
  if (enabledMethods.transfer) methodLines.push('• **Via Robux Transfer** — Transfer Robux langsung (harus berteman)')

  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('🛒 Beli Robux — BobaxShop')
    .setDescription('Beli Robux dengan harga terpercaya dan aman!\n\nKlik tombol di bawah untuk mulai transaksi.')
    .addFields(
      ...rateFields,
      { name: '🎮 Metode', value: methodLines.join('\n'), inline: false },
      { name: '📌 Ketentuan', value: `Min. **${formatRobux(minRobux)} Robux** • Kelipatan **${formatRobux(stepRobux)}**`, inline: false },
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

export function buildMethodRow(
  enabled: { community: boolean; gamepass: boolean; transfer: boolean } = { community: true, gamepass: true, transfer: false }
) {
  const buttons: ButtonBuilder[] = []
  if (enabled.gamepass) buttons.push(
    new ButtonBuilder().setCustomId('method_gamepass').setLabel('🎮 Via Gamepass').setStyle(ButtonStyle.Secondary)
  )
  if (enabled.community) buttons.push(
    new ButtonBuilder().setCustomId('method_community').setLabel('👥 Via Community Join').setStyle(ButtonStyle.Secondary)
  )
  if (enabled.transfer) buttons.push(
    new ButtonBuilder().setCustomId('method_transfer').setLabel('💸 Via Robux Transfer').setStyle(ButtonStyle.Secondary)
  )
  // Fallback jika semua dimatikan
  if (buttons.length === 0) buttons.push(
    new ButtonBuilder().setCustomId('method_community').setLabel('👥 Via Community Join').setStyle(ButtonStyle.Secondary)
  )
  return new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)
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
      { name: '🎮 Metode', value: order.method === 'gamepass' ? 'Via Gamepass' : order.method === 'transfer' ? 'Via Robux Transfer' : 'Via Community', inline: true },
      { name: '💳 Robux', value: `**${formatRobux(order.robuxAmount)}** Robux`, inline: true },
      ...(order.method === 'gamepass'
        ? [{ name: '🎯 Set Harga Gamepass', value: `**${formatRobux(order.robuxGross)}** Robux (termasuk tax 30%)`, inline: false }]
        : []),
      { name: '💳 Metode Bayar', value: paymentMethod.toUpperCase(), inline: true },
      { name: '💰 Total Bayar', value: `**${formatIDR(order.priceIdr)}**`, inline: true },
      { name: '⏱️ Berlaku', value: '15 menit', inline: true },
    )
    .setFooter({ text: 'Selesaikan pembayaran sebelum waktu habis' })
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  waiting_payment: '⏳ Menunggu Pembayaran',
  paid: '💳 Dibayar',
  processing: '🔄 Diproses',
  completed: '✅ Selesai',
  cancelled: '❌ Dibatalkan',
  refunded: '💰 Direfund',
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Pending',
  paid: '✅ Lunas',
  expired: '⏰ Kadaluarsa',
  failed: '❌ Gagal',
}

export function buildOrderAdminEmbed(order: Order) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.warning)
    .setTitle(`📦 Order Baru — ${order.orderNumber}`)
    .addFields(
      { name: '👤 Buyer', value: `<@${order.buyerId}> (${order.buyerUsername})`, inline: true },
      { name: '🎮 Metode', value: order.method === 'gamepass' ? 'Via Gamepass' : order.method === 'transfer' ? 'Via Robux Transfer' : 'Via Community', inline: true },
      { name: '💳 Robux (net)', value: formatRobux(order.robuxAmount), inline: true },
      { name: '💳 Robux (gross)', value: formatRobux(order.robuxGross), inline: true },
      { name: '💰 Total', value: formatIDR(order.priceIdr), inline: true },
      { name: '💳 Payment', value: `${order.paymentMethod} ✅`, inline: true },
      { name: '📊 Status Order', value: ORDER_STATUS_LABEL[order.orderStatus] ?? order.orderStatus, inline: true },
      { name: '💵 Status Bayar', value: PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus, inline: true },
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
      .setCustomId(`order_cancel:${orderId}`)
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`order_invalid_proof:${orderId}`)
      .setLabel('🚫 Bukti Invalid')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled)
  )
}
