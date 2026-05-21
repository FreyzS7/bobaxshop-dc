import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { requireAdmin } from '../../middleware/isAdmin'
import { getGuild, updateGuild } from '@bobaxshop/database'
import { COLORS, formatRobux, formatIDR } from '@bobaxshop/shared'

// Numeric configs — tambah entry baru di sini untuk extend
const NUMERIC_FIELDS = {
  min_robux: {
    label: 'Minimum Robux',
    unit: 'Robux',
    min: 100,
    max: 100_000,
    dbKey: 'minRobux' as const,
    isRate: false,
  },
  step_robux: {
    label: 'Kelipatan Robux',
    unit: 'Robux',
    min: 100,
    max: 10_000,
    dbKey: 'stepRobux' as const,
    isRate: false,
  },
}

export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Lihat dan ubah konfigurasi bot untuk server ini')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub.setName('view').setDescription('Lihat semua konfigurasi saat ini')
  )
  .addSubcommand((sub) =>
    sub
      .setName('set')
      .setDescription('Ubah konfigurasi numerik (min robux, kelipatan)')
      .addStringOption((opt) =>
        opt
          .setName('key')
          .setDescription('Konfigurasi yang ingin diubah')
          .setRequired(true)
          .addChoices(
            ...Object.entries(NUMERIC_FIELDS).map(([value, { label }]) => ({ name: label, value }))
          )
      )
      .addIntegerOption((opt) =>
        opt.setName('value').setDescription('Nilai baru').setRequired(true).setMinValue(1)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('payment-mode')
      .setDescription('Ubah mode pembayaran: manual (QRIS statis + bukti) atau midtrans (otomatis)')
      .addStringOption((opt) =>
        opt
          .setName('mode')
          .setDescription('Mode pembayaran')
          .setRequired(true)
          .addChoices(
            { name: '📋 Manual (QRIS statis + upload bukti)', value: 'manual' },
            { name: '⚡ Midtrans (otomatis)', value: 'midtrans' }
          )
      )
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })

  if (!(await requireAdmin(interaction))) return

  const guild = await getGuild(interaction.guild!.id)
  if (!guild?.setupDone) {
    await interaction.editReply({ content: '❌ Jalankan `/setup` terlebih dahulu.' })
    return
  }

  const sub = interaction.options.getSubcommand()

  // ── VIEW ──────────────────────────────────────────────────────────────────
  if (sub === 'view') {
    const modeLabel = guild.paymentMode === 'midtrans' ? '⚡ Midtrans (otomatis)' : '📋 Manual (QRIS statis + upload bukti)'
    const gpRate = guild.robuxRateGamepass ? formatIDR(Number(guild.robuxRateGamepass)) : '*(sama dengan Community)*'
    const embed = new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle('⚙️ Konfigurasi Server')
      .addFields(
        { name: 'Mode Pembayaran', value: `**${modeLabel}**`, inline: false },
        { name: '👥 Rate Community', value: `**${formatIDR(Number(guild.robuxRate ?? 0))}/Robux**`, inline: true },
        { name: '🎮 Rate Gamepass', value: `**${gpRate}/Robux**`, inline: true },
        ...Object.values(NUMERIC_FIELDS).map(({ label, unit, dbKey }) => ({
          name: label,
          value: `**${formatRobux(guild[dbKey] ?? 0)} ${unit}**`,
          inline: true,
        }))
      )
      .setFooter({ text: 'Gunakan /setrate, /config set, atau /config payment-mode untuk mengubah' })

    await interaction.editReply({ embeds: [embed] })
    return
  }

  // ── PAYMENT MODE ──────────────────────────────────────────────────────────
  if (sub === 'payment-mode') {
    const mode = interaction.options.getString('mode', true) as 'manual' | 'midtrans'
    await updateGuild(interaction.guild!.id, { paymentMode: mode })

    const label = mode === 'midtrans' ? '⚡ Midtrans (otomatis)' : '📋 Manual (QRIS statis + upload bukti)'
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.success)
          .setTitle('✅ Mode Pembayaran Diperbarui')
          .addFields({ name: 'Mode Aktif', value: `**${label}**`, inline: false }),
      ],
    })

    if (guild.chLogs) {
      const logCh = interaction.guild!.channels.cache.get(guild.chLogs)
      if (logCh?.isTextBased()) {
        await logCh.send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.info)
              .setDescription(`⚙️ Mode pembayaran diubah ke **${label}** oleh <@${interaction.user.id}>`),
          ],
        })
      }
    }
    return
  }

  // ── SET NUMERIC ───────────────────────────────────────────────────────────
  const key = interaction.options.getString('key', true) as keyof typeof NUMERIC_FIELDS
  const value = interaction.options.getInteger('value', true)
  const field = NUMERIC_FIELDS[key]

  if (!field) {
    await interaction.editReply({ content: '❌ Konfigurasi tidak dikenal.' })
    return
  }

  if (value < field.min || value > field.max) {
    await interaction.editReply({
      content: `❌ Nilai **${field.label}** harus antara **${formatRobux(field.min)}** dan **${formatRobux(field.max)} ${field.unit}**.`,
    })
    return
  }

  await updateGuild(interaction.guild!.id, { [field.dbKey]: value })

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.success)
        .setTitle('✅ Konfigurasi Diperbarui')
        .addFields({ name: field.label, value: `**${formatRobux(value)} ${field.unit}**`, inline: true }),
    ],
  })

  if (guild.chLogs) {
    const logCh = interaction.guild!.channels.cache.get(guild.chLogs)
    if (logCh?.isTextBased()) {
      await logCh.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.info)
            .setDescription(`⚙️ **${field.label}** diubah ke **${formatRobux(value)} ${field.unit}** oleh <@${interaction.user.id}>`),
        ],
      })
    }
  }
}
