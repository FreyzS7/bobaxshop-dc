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
  if (!(await requireAdmin(interaction))) return

  const target = interaction.options.getUser('user', true)
  const guildId = interaction.guild!.id

  if (target.bot) {
    await interaction.reply({ content: '❌ Tidak bisa menambahkan bot sebagai admin.', ephemeral: true })
    return
  }

  const already = await isAdmin(guildId, target.id)
  if (already) {
    await interaction.reply({ content: `⚠️ ${target.username} sudah menjadi admin.`, ephemeral: true })
    return
  }

  await addAdmin({ guildId, discordUserId: target.id, addedBy: interaction.user.id })

  const embed = new EmbedBuilder()
    .setColor(COLORS.success)
    .setDescription(`✅ **${target.username}** berhasil ditambahkan sebagai admin BobaxShop.`)

  await interaction.reply({ embeds: [embed] })
}
