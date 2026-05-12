import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Guild,
} from 'discord.js'
import { requireAdmin } from '../../middleware/isAdmin'
import { getGuild, updateGuild, upsertGuild } from '@bobaxshop/database'
import { COLORS } from '@bobaxshop/shared'

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Setup category & channels BobaxShop di server ini')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return

  await interaction.deferReply({ ephemeral: true })

  const guild = interaction.guild!

  // Pastikan guild terdaftar di DB
  await upsertGuild({ id: guild.id, name: guild.name })

  const existing = await getGuild(guild.id)
  if (existing?.setupDone) {
    await interaction.editReply('⚠️ Setup sudah pernah dilakukan. Hapus channels lama secara manual jika ingin setup ulang.')
    return
  }

  try {
    // Buat role Administration jika belum ada
    let adminRole = guild.roles.cache.find((r) => r.name === 'Administration')
    if (!adminRole) {
      adminRole = await guild.roles.create({
        name: 'Administration',
        color: 0x5865f2,
        reason: 'BobaxShop setup',
      })
    }

    // Buat Category "BobaxShop"
    const category = await guild.channels.create({
      name: 'BobaxShop',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.SendMessages] },
        { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
      ],
    })

    // Buat channels
    const chCommands = await createChannel(guild, '💬commands', category.id, adminRole.id, true)
    const chLogs = await createChannel(guild, '📋logs', category.id, adminRole.id, true)
    const chAnnounce = await createChannel(guild, '📢announce', category.id, adminRole.id, false)
    const chOrder = await createChannel(guild, '📦order', category.id, adminRole.id, true)
    const chBuy = await guild.channels.create({
      name: '🛒buy',
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        { id: guild.roles.everyone, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
        { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ],
    })

    // Buat Category "Pending Orders"
    const pendingCat = await guild.channels.create({
      name: 'Pending Orders',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
      ],
    })

    // Simpan ke DB
    await updateGuild(guild.id, {
      setupDone: true,
      adminRoleId: adminRole.id,
      categoryId: category.id,
      chCommands: chCommands.id,
      chLogs: chLogs.id,
      chAnnounce: chAnnounce.id,
      chOrder: chOrder.id,
      chBuy: chBuy.id,
      pendingCatId: pendingCat.id,
    })

    const embed = new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle('✅ BobaxShop Setup Selesai!')
      .setDescription('Semua channel dan category telah dibuat.')
      .addFields(
        { name: '📋 Logs', value: `<#${chLogs.id}>`, inline: true },
        { name: '📢 Announce', value: `<#${chAnnounce.id}>`, inline: true },
        { name: '📦 Order', value: `<#${chOrder.id}>`, inline: true },
        { name: '🛒 Buy', value: `<#${chBuy.id}>`, inline: true },
        { name: '⏳ Pending Orders', value: `<#${pendingCat.id}>`, inline: true },
      )
      .setFooter({ text: 'Gunakan /setrate untuk mengatur harga Robux' })

    await interaction.editReply({ embeds: [embed] })

    // Kirim notif ke #commands
    const cmdChannel = guild.channels.cache.get(chCommands.id)
    if (cmdChannel?.isTextBased()) {
      await cmdChannel.send({ embeds: [embed] })
    }

  } catch (err) {
    console.error('❌ Setup error:', err)
    await interaction.editReply('❌ Terjadi error saat setup. Pastikan bot punya permission Administrator.')
  }
}

async function createChannel(guild: Guild, name: string, categoryId: string, adminRoleId: string, adminOnly: boolean) {
  return guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: adminOnly
      ? [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: adminRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ]
      : [
          { id: guild.roles.everyone, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
          { id: adminRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ],
  })
}
