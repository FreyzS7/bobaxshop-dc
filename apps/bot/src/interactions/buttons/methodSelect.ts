import {
  type ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js'
import { setPendingOrder } from '../../utils/pendingOrders'
import { getGuild, getActiveBuyerOrder } from '@bobaxshop/database'
import { COLORS, formatIDR, formatRobux } from '@bobaxshop/shared'

export async function handleMethodSelect(interaction: ButtonInteraction, method: 'gamepass' | 'community' | 'transfer') {
  const guildId = interaction.guild!.id

  // Cek apakah buyer punya order waiting_payment yang belum diselesaikan
  const existingOrder = await getActiveBuyerOrder(guildId, interaction.user.id)
  if (existingOrder) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.warning)
      .setTitle('⚠️ Kamu masih punya order yang belum dibayar')
      .setDescription(`Order **${existingOrder.orderNumber}** masih menunggu pembayaran.\n\nKamu ingin melanjutkan pembayaran atau batalkan order lama dan buat yang baru?`)
      .addFields(
        { name: '💳 Robux', value: formatRobux(existingOrder.robuxAmount), inline: true },
        { name: '💰 Total', value: formatIDR(existingOrder.priceIdr), inline: true },
      )

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`resume_order:${existingOrder.id}`)
        .setLabel('Lanjutkan Pembayaran')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`cancel_and_new:${existingOrder.id}:${method}`)
        .setLabel('Batalkan & Buat Baru')
        .setStyle(ButtonStyle.Danger),
    )

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true })
    return
  }

  await showRobuxAmountModal(interaction, method)
}

export async function showRobuxAmountModal(interaction: ButtonInteraction, method: 'gamepass' | 'community' | 'transfer') {
  setPendingOrder(interaction.user.id, {
    guildId: interaction.guild!.id,
    buyerId: interaction.user.id,
    buyerUsername: interaction.user.username,
    method,
  })

  const guild = await getGuild(interaction.guild!.id)
  const minRobux = guild?.minRobux ?? 1000
  const stepRobux = guild?.stepRobux ?? 500

  const minChars = String(minRobux).length
  const maxChars = 7

  const modal = new ModalBuilder()
    .setCustomId(`modal_robux_amount:${method}`)
    .setTitle('Jumlah Robux')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('robux_amount')
          .setLabel(`Jumlah Robux (min. ${minRobux.toLocaleString('id-ID')}, kelipatan ${stepRobux.toLocaleString('id-ID')})`)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(`Contoh: ${minRobux}, ${minRobux + stepRobux}, ${minRobux + stepRobux * 2}`)
          .setMinLength(minChars)
          .setMaxLength(maxChars)
          .setRequired(true)
      )
    )

  await interaction.showModal(modal)
}
