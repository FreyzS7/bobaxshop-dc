import { ChannelType, PermissionFlagsBits, type Client, type Guild } from 'discord.js'
import { getActivePendingChannelIds, getGuild, updateGuild, upsertGuild } from '@bobaxshop/database'

export interface SetupResult {
  success: boolean
  message: string
}

export async function runSetup(client: Client, guildId: string): Promise<SetupResult> {
  const discordGuild = client.guilds.cache.get(guildId)
  if (!discordGuild) {
    return { success: false, message: 'Bot tidak ada di server ini.' }
  }

  await upsertGuild({ id: discordGuild.id, name: discordGuild.name })

  const existing = await getGuild(guildId)

  // Block if setupDone AND category channel still exists in Discord
  if (existing?.setupDone && existing.categoryId && discordGuild.channels.cache.has(existing.categoryId)) {
    return { success: false, message: 'Setup sudah dilakukan dan channel masih ada di server.' }
  }

  // Safety guard: block if a "BobaxShop" category exists in Discord by name
  const categoryByName = discordGuild.channels.cache.find(
    (c) => c.name === 'BobaxShop' && c.type === ChannelType.GuildCategory
  )
  if (categoryByName) {
    return { success: false, message: 'Category "BobaxShop" sudah ada di server ini. Hapus dulu sebelum setup ulang.' }
  }

  try {
    let adminRole = discordGuild.roles.cache.find((r) => r.name === 'Administration')
    if (!adminRole) {
      adminRole = await discordGuild.roles.create({
        name: 'Administration',
        color: 0x5865f2,
        reason: 'BobaxShop setup',
      })
    }

    const category = await discordGuild.channels.create({
      name: 'BobaxShop',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: discordGuild.roles.everyone, deny: [PermissionFlagsBits.SendMessages] },
        { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
      ],
    })

    const [chCommands, chLogs, chAnnounce, chOrder] = await Promise.all([
      createChannel(discordGuild, '💬commands', category.id, adminRole.id, true),
      createChannel(discordGuild, '📋logs', category.id, adminRole.id, true),
      createChannel(discordGuild, '📢announce', category.id, adminRole.id, false),
      createChannel(discordGuild, '📦order', category.id, adminRole.id, true),
    ])

    const chBuy = await discordGuild.channels.create({
      name: '🛒buy',
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        { id: discordGuild.roles.everyone, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
        { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ],
    })

    const pendingCat = await discordGuild.channels.create({
      name: 'Pending Orders',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: discordGuild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
      ],
    })

    await updateGuild(guildId, {
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

    return { success: true, message: 'Setup selesai! Semua channel telah dibuat.' }
  } catch (err) {
    console.error('❌ setupService error:', err)
    return { success: false, message: 'Error saat setup. Pastikan bot punya permission Administrator.' }
  }
}

export async function teardownGuild(client: Client, guildId: string): Promise<SetupResult> {
  const discordGuild = client.guilds.cache.get(guildId)
  const guildData = await getGuild(guildId)

  if (!discordGuild && !guildData) {
    return { success: false, message: 'Guild tidak ditemukan.' }
  }

  // Delete Discord channels if bot is still in the guild
  if (discordGuild && guildData) {
    // Fetch fresh channel list so cache is up to date
    await discordGuild.channels.fetch()

    // Collect all channel IDs to delete
    const pendingChannelIds = await getActivePendingChannelIds(guildId)

    const textChannelIds = [
      ...pendingChannelIds,
      guildData.chCommands,
      guildData.chLogs,
      guildData.chAnnounce,
      guildData.chOrder,
      guildData.chBuy,
    ].filter((id): id is string => !!id)

    // Delete text channels first (must be before categories)
    await Promise.allSettled(
      textChannelIds.map(async (id) => {
        try {
          const ch = discordGuild.channels.cache.get(id)
          if (ch) await ch.delete('BobaxShop teardown')
        } catch { /* already deleted or no permission */ }
      })
    )

    // Then delete categories
    const categoryIds = [guildData.categoryId, guildData.pendingCatId].filter((id): id is string => !!id)
    await Promise.allSettled(
      categoryIds.map(async (id) => {
        try {
          const ch = discordGuild.channels.cache.get(id)
          if (ch) await ch.delete('BobaxShop teardown')
        } catch { /* already deleted or no permission */ }
      })
    )
  }

  // Reset setup state in DB — keep orders & admins, just clear channel IDs
  if (guildData) {
    await updateGuild(guildId, {
      setupDone: false,
      categoryId: null,
      pendingCatId: null,
      chCommands: null,
      chLogs: null,
      chAnnounce: null,
      chOrder: null,
      chBuy: null,
    })
  }

  const guildName = discordGuild?.name ?? guildId
  if (discordGuild) {
    await discordGuild.leave()
  }

  return { success: true, message: `Bot berhasil keluar dari "${guildName}" dan semua channel telah dihapus.` }
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
