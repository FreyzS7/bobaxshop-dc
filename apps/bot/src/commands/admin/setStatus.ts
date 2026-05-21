import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { requireAdmin } from '../../middleware/isAdmin'
import { getGuild, updateGuild } from '@bobaxshop/database'
import { COLORS } from '@bobaxshop/shared'

export const data = new SlashCommandBuilder()
  .setName('setstatus')
  .setDescription('Update status toko BobaxShop')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((opt) =>
    opt
      .setName('status')
      .setDescription('Status toko')
      .setRequired(true)
      .addChoices(
        { name: '🟢 Open — Toko buka', value: 'open' },
        { name: '🔴 Closed — Toko tutup', value: 'closed' },
        { name: '🟡 Busy — Sedang sibuk', value: 'busy' }
      )
  )
  .addStringOption((opt) =>
    opt
      .setName('pesan')
      .setDescription('Pesan custom (opsional)')
      .setRequired(false)
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })

  if (!(await requireAdmin(interaction))) return

  const status = interaction.options.getString('status', true) as 'open' | 'closed' | 'busy'
  const pesan = interaction.options.getString('pesan') ?? null
  const guildId = interaction.guild!.id

  const guild = await getGuild(guildId)
  if (!guild?.setupDone) {
    await interaction.editReply('❌ Jalankan `/setup` terlebih dahulu.')
    return
  }

  const isOpen = status === 'open'
  await updateGuild(guildId, {
    isOpen,
    statusMessage: pesan,
  })

  const statusEmoji = { open: '🟢', closed: '🔴', busy: '🟡' }[status]
  const statusLabel = { open: 'Buka', closed: 'Tutup', busy: 'Sibuk' }[status]
  const color = { open: COLORS.success, closed: COLORS.error, busy: COLORS.warning }[status]

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${statusEmoji} Status Toko: ${statusLabel}`)

  if (pesan) embed.setDescription(pesan)

  await interaction.editReply({ embeds: [embed] })

  // Kirim ke #announce
  if (guild.chAnnounce) {
    const announceChannel = interaction.guild!.channels.cache.get(guild.chAnnounce)
    if (announceChannel?.isTextBased()) {
      await announceChannel.send({ embeds: [embed] })
    }
  }

  // Log ke #logs
  if (guild.chLogs) {
    const logsChannel = interaction.guild!.channels.cache.get(guild.chLogs)
    if (logsChannel?.isTextBased()) {
      await logsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.info)
            .setDescription(`🔧 Status diubah ke **${statusLabel}** oleh <@${interaction.user.id}>`),
        ],
      })
    }
  }
}
