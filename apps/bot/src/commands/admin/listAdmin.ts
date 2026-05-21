import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { requireAdmin } from '../../middleware/isAdmin'
import { getAdmins } from '@bobaxshop/database'
import { COLORS } from '@bobaxshop/shared'

export const data = new SlashCommandBuilder()
  .setName('listadmin')
  .setDescription('Lihat daftar admin BobaxShop')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })

  if (!(await requireAdmin(interaction))) return

  const admins = await getAdmins(interaction.guild!.id)

  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('👥 Daftar Admin BobaxShop')

  if (admins.length === 0) {
    embed.setDescription('Belum ada admin terdaftar di tabel. Admin dengan role "Administration" tetap bisa menggunakan commands admin.')
  } else {
    embed.setDescription(admins.map((a, i) => `${i + 1}. <@${a.discordUserId}>`).join('\n'))
  }

  await interaction.editReply({ embeds: [embed] })
}
