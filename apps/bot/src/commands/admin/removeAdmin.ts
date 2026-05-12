import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { requireAdmin } from '../../middleware/isAdmin'
import { removeAdmin, isAdmin } from '@bobaxshop/database'
import { COLORS } from '@bobaxshop/shared'

export const data = new SlashCommandBuilder()
  .setName('removeadmin')
  .setDescription('Hapus admin BobaxShop')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((opt) =>
    opt.setName('user').setDescription('Admin yang akan dihapus').setRequired(true)
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return

  const target = interaction.options.getUser('user', true)
  const guildId = interaction.guild!.id

  const exists = await isAdmin(guildId, target.id)
  if (!exists) {
    await interaction.reply({ content: `⚠️ ${target.username} bukan admin.`, ephemeral: true })
    return
  }

  await removeAdmin(guildId, target.id)

  const embed = new EmbedBuilder()
    .setColor(COLORS.error)
    .setDescription(`✅ **${target.username}** berhasil dihapus dari daftar admin.`)

  await interaction.reply({ embeds: [embed] })
}
