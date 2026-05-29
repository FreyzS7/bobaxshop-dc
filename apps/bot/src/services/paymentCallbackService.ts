import {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  AttachmentBuilder,
  type Client,
  type Message,
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

  // Tag buyer di pending channel
  if (pendingChannel) {
    await pendingChannel.send({
      content: `<@${order.buyerId}>`,
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.info)
          .setDescription(
            `Halo <@${order.buyerId}>! 👋\n\nOrder **${order.orderNumber}** sedang diproses oleh admin.\n` +
            `Jika ada yang ingin disampaikan atau ditanyakan, **chat di sini** ya!`
          ),
      ],
    }).catch(() => null)
  }

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

/**
 * Dipanggil setelah buyer upload bukti transfer di proof channel (mode manual).
 */
export async function handleManualProof(
  client: Client,
  orderId: string,
  proofImageUrl: string,
  sourceMessage: Message
) {
  const order = await getOrder(orderId)
  if (!order) return

  const guild = await getGuild(order.guildId)
  if (!guild) return

  const discordGuild = client.guilds.cache.get(order.guildId)
  if (!discordGuild) return

  // Mark order sebagai paid + processing
  await updateOrder(orderId, { paymentStatus: 'paid', orderStatus: 'processing', processedBy: 'system', proofImageUrl })
  await addOrderLog(orderId, 'paid', order.buyerId, 'Bukti transfer diterima')
  await addOrderLog(orderId, 'processing', 'system', 'Order diteruskan ke admin')

  // Re-fetch order supaya embed pakai status terbaru
  const updatedOrder = (await getOrder(orderId)) ?? order

  // Resolve admin role mention
  const adminRole = guild.adminRoleId
    ? discordGuild.roles.cache.get(guild.adminRoleId)
    : discordGuild.roles.cache.find((r) => r.name === 'Administration')
  const adminMention = adminRole ? `<@&${adminRole.id}>` : ''

  // Update atau kirim baru ke #order dengan bukti transfer
  if (guild.chOrder) {
    const orderChannel = discordGuild.channels.cache.get(guild.chOrder)
    if (orderChannel?.isTextBased()) {
      const proofAttachment = new AttachmentBuilder(proofImageUrl, { name: 'bukti-transfer.png' })

      const isReupload = !!order.orderChannelMsgId
      const proofChMention = order.pendingChannelId ? ` — <#${order.pendingChannelId}>` : ''
      const notifContent = isReupload
        ? `${adminMention} 🔁 Bukti ulang dari <@${order.buyerId}>${proofChMention} — mohon diperiksa.`
        : `${adminMention} 📥 Order baru! Bukti dari <@${order.buyerId}>${proofChMention}`
      const allowedMentions = { roles: adminRole ? [adminRole.id] : [] }

      // Coba edit pesan lama jika sudah ada (re-upload setelah bukti ditolak)
      if (order.orderChannelMsgId) {
        try {
          const existing = await orderChannel.messages.fetch(order.orderChannelMsgId)
          await existing.edit({
            content: notifContent,
            embeds: [buildOrderAdminEmbed(updatedOrder)],
            components: [buildAdminActionRow(updatedOrder.id)],
            attachments: [],
            files: [proofAttachment],
          })
          // Re-ping admin dengan allowed mentions (edit tidak trigger mention, kirim lalu hapus)
          const ping = await orderChannel.send({ content: notifContent, allowedMentions })
          await ping.delete().catch(() => null)
        } catch {
          // pesan lama sudah dihapus, kirim baru
          const msg = await orderChannel.send({
            content: notifContent,
            embeds: [buildOrderAdminEmbed(updatedOrder)],
            components: [buildAdminActionRow(updatedOrder.id)],
            files: [proofAttachment],
            allowedMentions,
          })
          await updateOrder(orderId, { orderChannelMsgId: msg.id })
        }
      } else {
        const msg = await orderChannel.send({
          content: notifContent,
          embeds: [buildOrderAdminEmbed(updatedOrder)],
          components: [buildAdminActionRow(updatedOrder.id)],
          files: [proofAttachment],
          allowedMentions,
        })
        await updateOrder(orderId, { orderChannelMsgId: msg.id })
      }
    }
  }

  // Reply di proof channel
  await sourceMessage.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.success)
        .setDescription(
          `✅ Bukti transfer diterima! Order **${order.orderNumber}** sudah diteruskan ke admin.\n` +
          `Jika ada yang ingin ditanyakan, chat di channel ini ya 💬`
        ),
    ],
  }).catch(() => null)

  // Log ke #logs
  if (guild.chLogs) {
    const logsChannel = discordGuild.channels.cache.get(guild.chLogs)
    if (logsChannel?.isTextBased()) {
      await logsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setDescription(`💳 Bukti transfer diterima untuk **${order.orderNumber}** dari <@${order.buyerId}>`),
        ],
      })
    }
  }

  // DM buyer konfirmasi
  try {
    const buyer = await client.users.fetch(order.buyerId)
    await buyer.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.success)
          .setTitle('✅ Bukti Transfer Diterima!')
          .setDescription(`Order **${order.orderNumber}** sedang diproses oleh admin.\nKamu akan mendapat notifikasi setelah selesai.`),
      ],
    })
  } catch { /* DM off */ }
}

type FailReason = 'cancel' | 'deny' | 'failure'

const FAIL_META: Record<FailReason, { title: string; desc: string; log: string }> = {
  cancel: {
    title: '🚫 Pembayaran Dibatalkan',
    desc: 'Order **{orderNumber}** dibatalkan. Silakan buat order baru jika masih ingin membeli Robux.',
    log: '🚫 Order **{orderNumber}** dibatalkan',
  },
  deny: {
    title: '❌ Pembayaran Ditolak',
    desc: 'Order **{orderNumber}** ditolak oleh sistem pembayaran. Coba gunakan metode pembayaran lain atau hubungi admin.',
    log: '❌ Order **{orderNumber}** ditolak (fraud/deny)',
  },
  failure: {
    title: '⚠️ Pembayaran Gagal',
    desc: 'Order **{orderNumber}** gagal diproses. Silakan buat order baru atau hubungi admin.',
    log: '⚠️ Order **{orderNumber}** gagal diproses',
  },
}

export async function handlePaymentFailed(client: Client, orderId: string, reason: FailReason) {
  const order = await getOrder(orderId)
  if (!order) return

  await updateOrder(orderId, { paymentStatus: 'failed', orderStatus: 'cancelled' })
  await addOrderLog(orderId, reason, 'system', `Pembayaran ${reason}`)

  const meta = FAIL_META[reason]
  const fill = (s: string) => s.replace(/{orderNumber}/g, order.orderNumber)

  try {
    const buyer = await client.users.fetch(order.buyerId)
    await buyer.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.error)
          .setTitle(meta.title)
          .setDescription(fill(meta.desc)),
      ],
    })
  } catch {
    console.warn(`⚠️ Tidak bisa DM buyer ${order.buyerId}`)
  }

  const guild = await getGuild(order.guildId)
  if (guild?.chLogs) {
    const discordGuild = client.guilds.cache.get(order.guildId)
    const logsChannel = discordGuild?.channels.cache.get(guild.chLogs)
    if (logsChannel?.isTextBased()) {
      await logsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setDescription(`${fill(meta.log)} — <@${order.buyerId}>`),
        ],
      })
    }
  }
}

export async function handlePaymentExpired(client: Client, orderId: string) {
  const order = await getOrder(orderId)
  if (!order) return

  await updateOrder(orderId, { paymentStatus: 'expired', orderStatus: 'cancelled' })
  await addOrderLog(orderId, 'expired', 'system', 'Pembayaran kadaluarsa')

  // DM buyer
  try {
    const buyer = await client.users.fetch(order.buyerId)
    await buyer.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.error)
          .setTitle('⏰ Pembayaran Kadaluarsa')
          .setDescription(
            `Order **${order.orderNumber}** sudah kadaluarsa karena pembayaran tidak diterima tepat waktu.\n\n` +
            'Silakan buat order baru jika masih ingin membeli Robux.'
          ),
      ],
    })
  } catch {
    console.warn(`⚠️ Tidak bisa DM buyer ${order.buyerId}`)
  }

  // Log ke #logs
  const guild = await getGuild(order.guildId)
  if (guild?.chLogs) {
    const discordGuild = client.guilds.cache.get(order.guildId)
    const logsChannel = discordGuild?.channels.cache.get(guild.chLogs)
    if (logsChannel?.isTextBased()) {
      await logsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setDescription(`⏰ Order **${order.orderNumber}** kadaluarsa — <@${order.buyerId}>`),
        ],
      })
    }
  }
}
