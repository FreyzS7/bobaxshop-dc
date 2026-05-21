import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { requireAdmin } from '../../middleware/isAdmin'
import { addAdmin, isAdmin } from '@bobaxshop/database'
import { COLORS } from '@bobaxshop/shared'

export const data = new SlashCommandBuilder()
  .setName('addadmin')
  .setDescription('Tambah admin BobaxShop')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((opt) =>
    opt.setName('user').setDescription('User yang akan dijadikan admin').setRequired(true)
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })

  if (!(await requireAdmin(interaction))) return

  const target = interaction.options.getUser('user', true)
  const guildId = interaction.guild!.id

  if (target.bot) {
    await interaction.editReply('❌ Tidak bisa menambahkan bot sebagai admin.')
    return
  }

  const already = await isAdmin(guildId, target.id)
  if (already) {
    await interaction.editReply(`⚠️ ${target.username} sudah menjadi admin.`)
    return
  }

  await addAdmin({ guildId, discordUserId: target.id, addedBy: interaction.user.id })

  const embed = new EmbedBuilder()
    .setColor(COLORS.success)
    .setDescription(`✅ **${target.username}** berhasil ditambahkan sebagai admin BobaxShop.`)

  await interaction.editReply({ embeds: [embed] })
}
