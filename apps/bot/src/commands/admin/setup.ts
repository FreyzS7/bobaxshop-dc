import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { requireAdmin } from '../../middleware/isAdmin'
import { COLORS } from '@bobaxshop/shared'
import { runSetup } from '../../services/setupService'

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Setup category & channels BobaxShop di server ini')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })

  if (!(await requireAdmin(interaction))) return

  const result = await runSetup(interaction.client, interaction.guild!.id)

  if (!result.success) {
    await interaction.editReply(`⚠️ ${result.message}`)
    return
  }

  const guild = interaction.guild!
  const guildData = await import('@bobaxshop/database').then((m) => m.getGuild(guild.id))

  const embed = new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle('✅ BobaxShop Setup Selesai!')
    .setDescription('Semua channel dan category telah dibuat.')
    .addFields(
      { name: '📋 Logs', value: guildData?.chLogs ? `<#${guildData.chLogs}>` : '-', inline: true },
      { name: '📢 Announce', value: guildData?.chAnnounce ? `<#${guildData.chAnnounce}>` : '-', inline: true },
      { name: '📦 Order', value: guildData?.chOrder ? `<#${guildData.chOrder}>` : '-', inline: true },
      { name: '🛒 Buy', value: guildData?.chBuy ? `<#${guildData.chBuy}>` : '-', inline: true },
      { name: '⏳ Pending Orders', value: guildData?.pendingCatId ? `<#${guildData.pendingCatId}>` : '-', inline: true },
    )
    .setFooter({ text: 'Gunakan /setrate untuk mengatur harga Robux' })

  await interaction.editReply({ embeds: [embed] })

  if (guildData?.chCommands) {
    const cmdChannel = guild.channels.cache.get(guildData.chCommands)
    if (cmdChannel?.isTextBased()) await cmdChannel.send({ embeds: [embed] })
  }
}
