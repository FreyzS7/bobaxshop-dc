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
import { buildGamepassLinkButtonRow } from '../../services/embedService'

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

  if (isNaN(robuxAmount) || robuxAmount < 1000) {
    await interaction.reply({ content: '❌ Minimal pembelian **1.000 Robux**.', ephemeral: true })
    return
  }
  if (robuxAmount % 500 !== 0) {
    await interaction.reply({ content: '❌ Jumlah Robux harus kelipatan **500**. Contoh: 1000, 1500, 2000, ...', ephemeral: true })
    return
  }

  const guild = await getGuild(pending.guildId)
  if (!guild?.robuxRate) {
    await interaction.reply({ content: '❌ Rate belum diset.', ephemeral: true })
    return
  }

  const rate = Number(guild.robuxRate)
  const robuxGross = method === 'gamepass' ? calcRobuxGross(robuxAmount) : robuxAmount
  const priceIdr = calcPrice(robuxAmount, rate)

  updatePendingOrder(interaction.user.id, { robuxAmount, robuxGross, priceIdr })

  const summaryEmbed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('📋 Ringkasan Order')
    .addFields(
      { name: '💎 Robux yang kamu terima', value: `**${formatRobux(robuxAmount)} Robux**`, inline: true },
      { name: '💰 Total Bayar', value: `**${formatIDR(priceIdr)}**`, inline: true },
      ...(method === 'gamepass'
        ? [{
            name: '📌 Instruksi Gamepass',
            value: `Set harga gamepass kamu ke **${formatRobux(robuxGross)} Robux**\n> Setelah dipotong tax 30% Roblox, kamu akan menerima **${formatRobux(robuxAmount)} Robux**`,
            inline: false,
          }]
        : []),
    )

  if (method === 'gamepass') {
    await interaction.reply({
      embeds: [summaryEmbed.addFields({ name: '\u200B', value: '⬇️ Klik tombol di bawah untuk input link gamepass kamu.' })],
      components: [buildGamepassLinkButtonRow()],
      ephemeral: true,
    })
  } else {
    // Community: minta username Roblox dulu
    await interaction.reply({
      embeds: [summaryEmbed.addFields({ name: '\u200B', value: '⬇️ Klik tombol di bawah untuk input username Roblox kamu.' })],
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
