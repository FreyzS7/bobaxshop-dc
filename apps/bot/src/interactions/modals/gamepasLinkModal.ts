import {
  type ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js'
import { COLORS, formatIDR, formatRobux } from '@bobaxshop/shared'
import { updatePendingOrder, getPendingOrder } from '../../utils/pendingOrders'

const GAMEPASS_REGEX = /roblox\.com\/game-pass\//i

export async function handleGamepassLinkModal(interaction: ModalSubmitInteraction) {
  const pending = getPendingOrder(interaction.user.id)
  if (!pending) {
    await interaction.reply({ content: '❌ Sesi habis. Mulai ulang dari tombol Beli Robux.', ephemeral: true })
    return
  }

  const link = interaction.fields.getTextInputValue('gamepass_link').trim()

  if (!GAMEPASS_REGEX.test(link)) {
    await interaction.reply({
      content: '❌ Link tidak valid. Pastikan link adalah gamepass Roblox yang benar.\nContoh: `https://www.roblox.com/game-pass/123456789/nama`',
      ephemeral: true,
    })
    return
  }

  updatePendingOrder(interaction.user.id, { gamepassLink: link })

  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('📋 Ringkasan Order')
    .addFields(
      { name: '🎮 Metode', value: 'Via Gamepass', inline: true },
      { name: '💎 Robux (kamu terima)', value: formatRobux(pending.robuxAmount!), inline: true },
      { name: '🎯 Set Gamepass', value: formatRobux(pending.robuxGross!), inline: true },
      { name: '🔗 Link Gamepass', value: link, inline: false },
      { name: '💰 Total Bayar', value: formatIDR(pending.priceIdr!), inline: true },
      { name: '\u200B', value: 'Pilih metode pembayaran:', inline: false },
    )

  await interaction.reply({
    embeds: [embed],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('pay_qris')
          .setLabel('📱 Bayar dengan QRIS')
          .setStyle(ButtonStyle.Primary)
      ),
    ],
    ephemeral: true,
  })
}
