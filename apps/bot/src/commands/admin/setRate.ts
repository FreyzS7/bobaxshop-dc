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
  .setDescription('Set harga IDR per 1 Robux (setelah tax)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addNumberOption((opt) =>
    opt
      .setName('harga')
      .setDescription('Harga IDR per 1 Robux (contoh: 165)')
      .setRequired(true)
      .setMinValue(1)
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return

  const harga = interaction.options.getNumber('harga', true)
  const guildId = interaction.guild!.id

  const guild = await getGuild(guildId)
  if (!guild?.setupDone) {
    await interaction.reply({ content: '❌ Jalankan `/setup` terlebih dahulu.', ephemeral: true })
    return
  }

  await updateGuild(guildId, { robuxRate: String(harga) })

  const embed = new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle('💰 Rate Diperbarui')
    .setDescription(`Rate sekarang: **${formatIDR(harga)}** per 1 Robux`)
    .setFooter({ text: 'Gunakan /setbuy untuk update embed di #buy' })

  await interaction.reply({ embeds: [embed] })

  // Log ke #logs
  if (guild.chLogs) {
    const logsChannel = interaction.guild!.channels.cache.get(guild.chLogs)
    if (logsChannel?.isTextBased()) {
      await logsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.info)
            .setDescription(`🔧 Rate diubah ke **${formatIDR(harga)}/Robux** oleh <@${interaction.user.id}>`),
        ],
      })
    }
  }
}
