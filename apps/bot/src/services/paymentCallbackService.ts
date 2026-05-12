import {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  type Client,
} from 'discord.js'
import { updateOrder, getOrder, addOrderLog, getGuild } from '@bobaxshop/database'
import { COLORS } from '@bobaxshop/shared'
import { buildOrderAdminEmbed, buildAdminActionRow } from './embedService'

/**
 * Dipanggil setelah pembayaran dikonfirmasi (Midtrans webhook atau mock).
 * Membuat channel pending, kirim embed admin, DM buyer, log.
 */
export async function handlePaymentSuccess(client: Client, orderId: string) {
  const order = await getOrder(orderId)
  if (!order) return console.error(`handlePaymentSuccess: order ${orderId} tidak ditemukan`)

  const guild = await getGuild(order.guildId)
  if (!guild) return

  const discordGuild = client.guilds.cache.get(order.guildId)
  if (!discordGuild) return

  // Update status order ke paid
  await updateOrder(orderId, { paymentStatus: 'paid', orderStatus: 'paid' })
  await addOrderLog(orderId, 'paid', 'system', 'Pembayaran dikonfirmasi')

  // Cari admin role
  const adminRole = guild.adminRoleId
    ? discordGuild.roles.cache.get(guild.adminRoleId)
    : discordGuild.roles.cache.find((r) => r.name === 'Administration')

  // Buat channel di Pending Orders
  let pendingChannel
  try {
    pendingChannel = await discordGuild.channels.create({
      name: `order-${order.buyerUsername}-${order.orderNumber}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      type: ChannelType.GuildText,
      parent: guild.pendingCatId ?? undefined,
      permissionOverwrites: [
        { id: discordGuild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        ...(adminRole
          ? [{ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
          : []),
      ],
    })
  } catch (err) {
    console.error('❌ Gagal buat pending channel:', err)
  }

  // Kirim embed ke #order
  let orderMsgId: string | undefined
  if (guild.chOrder) {
    const orderChannel = discordGuild.channels.cache.get(guild.chOrder)
    if (orderChannel?.isTextBased()) {
      const msg = await orderChannel.send({
        embeds: [buildOrderAdminEmbed(order)],
        components: [buildAdminActionRow(order.id)],
      })
      orderMsgId = msg.id
    }
  }

  // Update order dengan channel IDs
  await updateOrder(orderId, {
    pendingChannelId: pendingChannel?.id ?? null,
    orderChannelMsgId: orderMsgId ?? null,
    orderStatus: 'processing',
  })
  await addOrderLog(orderId, 'processing', 'system', 'Channel pending dibuat, menunggu admin')

  // DM ke buyer
  try {
    const buyer = await client.users.fetch(order.buyerId)
    await buyer.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.success)
          .setTitle('✅ Pembayaran Diterima!')
          .setDescription(`Order **${order.orderNumber}** sedang diproses oleh admin.\nKamu akan mendapat DM lagi setelah selesai.`),
      ],
    })
  } catch {
    console.warn(`⚠️ Tidak bisa DM buyer ${order.buyerId}`)
  }

  // Log ke #logs
  if (guild.chLogs) {
    const logsChannel = discordGuild.channels.cache.get(guild.chLogs)
    if (logsChannel?.isTextBased()) {
      await logsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setDescription(`💳 Pembayaran diterima untuk **${order.orderNumber}** oleh <@${order.buyerId}>`),
        ],
      })
    }
  }
}
