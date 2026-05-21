import { type ButtonInteraction, ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import { getOrder, getGuild, updateOrder, addOrderLog } from '@bobaxshop/database'
import { COLORS } from '@bobaxshop/shared'

export async function handleConfirmProof(interaction: ButtonInteraction, orderId: string) {
  await interaction.deferReply({ ephemeral: true })

  const order = await getOrder(orderId)
  if (!order) {
    await interaction.editReply({ content: '❌ Order tidak ditemukan.' })
    return
  }

  if (order.buyerId !== interaction.user.id) {
    await interaction.editReply({ content: '❌ Kamu bukan pemilik order ini.' })
    return
  }

  if (order.pendingChannelId) {
    await interaction.editReply({ content: `⚠️ Channel bukti sudah dibuat: <#${order.pendingChannelId}>` })
    return
  }

  const guild = await getGuild(order.guildId)
  const discordGuild = interaction.guild!

  // Cari admin role
  const adminRole = guild?.adminRoleId
    ? discordGuild.roles.cache.get(guild.adminRoleId)
    : discordGuild.roles.cache.find((r) => r.name === 'Administration')

  // Buat channel untuk upload bukti
  let proofChannel
  try {
    proofChannel = await discordGuild.channels.create({
      name: `bukti-${order.buyerUsername}-${order.orderNumber}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      type: ChannelType.GuildText,
      parent: guild?.pendingCatId ?? undefined,
      permissionOverwrites: [
        { id: discordGuild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        ...(adminRole
          ? [{ id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
          : []),
      ],
    })
  } catch (err) {
    console.error('❌ Gagal buat proof channel:', err)
    await interaction.editReply({ content: '❌ Gagal membuat channel. Hubungi admin.' })
    return
  }

  // Simpan channel ID ke order
  await updateOrder(orderId, { pendingChannelId: proofChannel.id })
  await addOrderLog(orderId, 'proof_requested', interaction.user.id, 'Buyer konfirmasi transfer, menunggu bukti')

  // Kirim instruksi di channel
  await proofChannel.send({
    content: `<@${interaction.user.id}>`,
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle('📤 Upload Bukti Transfer')
        .setDescription(
          `Halo <@${interaction.user.id}>!\n\n` +
          `Upload **screenshot/foto bukti transfer** kamu di channel ini.\n` +
          `Bot akan otomatis memproses setelah bukti diterima.\n\n` +
          `> Order: **${order.orderNumber}**`
        )
        .setFooter({ text: 'Kirim 1 gambar bukti transfer' }),
    ],
  })

  await interaction.editReply({
    content: `✅ Channel bukti transfer sudah dibuat: <#${proofChannel.id}>\nSilakan upload screenshot bukti transfer di sana.`,
  })
}
