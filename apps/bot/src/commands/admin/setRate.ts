import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { requireAdmin } from '../../middleware/isAdmin'
import { getGuild, updateGuild } from '@bobaxshop/database'
import { COLORS, formatIDR } from '@bobaxshop/shared'

export const data = new SlashCommandBuilder()
  .setName('setrate')
  .setDescription('Set harga IDR per 1 Robux')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addNumberOption((opt) =>
    opt
      .setName('harga')
      .setDescription('Harga IDR per 1 Robux (contoh: 165)')
      .setRequired(true)
      .setMinValue(1)
  )
  .addStringOption((opt) =>
    opt
      .setName('metode')
      .setDescription('Metode yang diset (default: community)')
      .setRequired(false)
      .addChoices(
        { name: '👥 Community', value: 'community' },
        { name: '🎮 Gamepass', value: 'gamepass' },
      )
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })

  if (!(await requireAdmin(interaction))) return

  const harga = interaction.options.getNumber('harga', true)
  const metode = (interaction.options.getString('metode') ?? 'community') as 'community' | 'gamepass'
  const guildId = interaction.guild!.id

  const guild = await getGuild(guildId)
  if (!guild?.setupDone) {
    await interaction.editReply('❌ Jalankan `/setup` terlebih dahulu.')
    return
  }

  const updateData = metode === 'gamepass'
    ? { robuxRateGamepass: String(harga) }
    : { robuxRate: String(harga) }

  await updateGuild(guildId, updateData)

  const label = metode === 'gamepass' ? '🎮 Rate Gamepass' : '👥 Rate Community'
  const embed = new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle('💰 Rate Diperbarui')
    .setDescription(`${label}: **${formatIDR(harga)}** per 1 Robux`)
    .setFooter({ text: 'Gunakan /setbuy untuk update embed di #buy' })

  await interaction.editReply({ embeds: [embed] })

  // Log ke #logs
  if (guild.chLogs) {
    const logsChannel = interaction.guild!.channels.cache.get(guild.chLogs)
    if (logsChannel?.isTextBased()) {
      await logsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.info)
            .setDescription(`🔧 ${label} diubah ke **${formatIDR(harga)}/Robux** oleh <@${interaction.user.id}>`),
        ],
      })
    }
  }
}
