import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  AttachmentBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { requireAdmin } from '../../middleware/isAdmin'
import { getGuild, updateGuild } from '@bobaxshop/database'
import { COLORS } from '@bobaxshop/shared'

export const data = new SlashCommandBuilder()
  .setName('setqris')
  .setDescription('Set gambar QRIS untuk server ini')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addAttachmentOption((opt) =>
    opt
      .setName('gambar')
      .setDescription('Upload gambar QRIS (JPG/PNG)')
      .setRequired(true)
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })
  if (!(await requireAdmin(interaction))) return

  const guild = await getGuild(interaction.guild!.id)
  if (!guild?.setupDone) {
    await interaction.editReply('❌ Jalankan `/setup` terlebih dahulu.')
    return
  }

  const attachment = interaction.options.getAttachment('gambar', true)

  if (!attachment.contentType?.startsWith('image/')) {
    await interaction.editReply('❌ File harus berupa gambar (JPG/PNG).')
    return
  }

  // Re-upload ke channel logs supaya URL permanent (tidak expire)
  let permanentUrl = attachment.url
  if (guild.chLogs) {
    const logsChannel = interaction.guild!.channels.cache.get(guild.chLogs)
    if (logsChannel?.isTextBased()) {
      const stored = await logsChannel.send({
        content: `📷 QRIS image untuk server ini (jangan hapus pesan ini)`,
        files: [new AttachmentBuilder(attachment.url, { name: 'qris.png' })],
      })
      permanentUrl = stored.attachments.first()?.url ?? attachment.url
    }
  }

  await updateGuild(interaction.guild!.id, { qrisImageUrl: permanentUrl })

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.success)
        .setTitle('✅ QRIS Diperbarui')
        .setDescription('Gambar QRIS server ini berhasil diupdate. Semua order baru akan menggunakan gambar ini.')
        .setImage(permanentUrl),
    ],
  })
}
