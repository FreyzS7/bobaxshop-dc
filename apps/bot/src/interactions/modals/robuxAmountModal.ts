import {
  type ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js'
import { getGuild } from '@bobaxshop/database'
import { COLORS, formatIDR, formatRobux, calcRobuxGross, calcPrice } from '@bobaxshop/shared'
import { updatePendingOrder, getPendingOrder } from '../../utils/pendingOrders'

export async function handleRobuxAmountModal(
  interaction: ModalSubmitInteraction,
  method: 'gamepass' | 'community'
) {
  const pending = getPendingOrder(interaction.user.id)
  if (!pending) {
    await interaction.reply({ content: '❌ Sesi habis. Mulai ulang dari tombol Beli Robux.', ephemeral: true })
    return
  }

  const rawAmount = interaction.fields.getTextInputValue('robux_amount').trim()
  const robuxAmount = parseInt(rawAmount, 10)

  const guild = await getGuild(pending.guildId)
  if (!guild?.robuxRate) {
    await interaction.reply({ content: '❌ Rate belum diset.', ephemeral: true })
    return
  }

  const minRobux = guild.minRobux ?? 1000
  const stepRobux = guild.stepRobux ?? 500

  if (isNaN(robuxAmount) || robuxAmount < minRobux) {
    await interaction.reply({ content: `❌ Minimal pembelian **${formatRobux(minRobux)} Robux**.`, ephemeral: true })
    return
  }
  if (robuxAmount % stepRobux !== 0) {
    await interaction.reply({
      content: `❌ Jumlah Robux harus kelipatan **${formatRobux(stepRobux)}**. Contoh: ${formatRobux(minRobux)}, ${formatRobux(minRobux + stepRobux)}, ...`,
      ephemeral: true,
    })
    return
  }

  const rate = method === 'gamepass' && guild.robuxRateGamepass
    ? Number(guild.robuxRateGamepass)
    : Number(guild.robuxRate)

  const robuxGross = method === 'gamepass' ? calcRobuxGross(robuxAmount) : robuxAmount
  const priceIdr = calcPrice(robuxAmount, rate)

  updatePendingOrder(interaction.user.id, { robuxAmount, robuxGross, priceIdr })

  const summaryEmbed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('📋 Ringkasan Order')
    .addFields(
      { name: '💳 Robux yang kamu terima', value: `**${formatRobux(robuxAmount)} Robux**`, inline: true },
      { name: '💰 Total Bayar', value: `**${formatIDR(priceIdr)}**`, inline: true },
    )

  if (method === 'gamepass') {
    summaryEmbed.addFields(
      {
        name: '📌 Instruksi Gamepass',
        value: [
          `Set harga gamepass kamu ke **${formatRobux(robuxGross)} Robux**`,
          `> Setelah dipotong tax 30% Roblox, kamu akan menerima **${formatRobux(robuxAmount)} Robux**`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '⚠️ Syarat Wajib',
        value: [
          '1. Experience harus **Public**, **Rated**, dan **tercantum di profil** kamu',
          '2. Buat **Gamepass** di dalam experience tersebut dengan harga yang sudah ditentukan',
          '3. Pastikan gamepass sudah **aktif** dan bisa dibeli',
        ].join('\n'),
        inline: false,
      },
      { name: '\u200B', value: '⬇️ Klik tombol di bawah untuk input **username Roblox** kamu.', inline: false }
    )

    await interaction.reply({
      embeds: [summaryEmbed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('input_roblox_username')
            .setLabel('👤 Input Username Roblox')
            .setStyle(ButtonStyle.Primary)
        ),
      ],
      ephemeral: true,
    })
  } else {
    summaryEmbed.addFields(
      { name: '\u200B', value: '⬇️ Klik tombol di bawah untuk input **username Roblox** kamu.', inline: false }
    )

    await interaction.reply({
      embeds: [summaryEmbed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('input_roblox_username')
            .setLabel('👤 Input Username Roblox')
            .setStyle(ButtonStyle.Primary)
        ),
      ],
      ephemeral: true,
    })
  }
}
