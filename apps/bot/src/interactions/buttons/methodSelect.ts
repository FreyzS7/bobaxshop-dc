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
import { getTransferStock } from '../../services/stockService'

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
  const guildId = interaction.guild!.id

  // Cek stok transfer sebelum tampilkan modal
  if (method === 'transfer') {
    const stock = await getTransferStock(guildId)
    if (stock !== null && stock.remaining <= 0) {
      await interaction.reply({
        content: `❌ Stok **Via Robux Transfer** hari ini sudah habis (limit: **${stock.limit.toLocaleString('id-ID')} Robux**).\nCoba lagi besok atau pilih metode lain.`,
        ephemeral: true,
      })
      return
    }
  }

  setPendingOrder(interaction.user.id, {
    guildId,
    buyerId: interaction.user.id,
    buyerUsername: interaction.user.username,
    method,
  })

  const guild = await getGuild(guildId)
  const minRobux = guild?.minRobux ?? 1000
  const stepRobux = guild?.stepRobux ?? 500

  const stock = method === 'transfer' ? await getTransferStock(guildId) : null
  const maxRobux = stock ? stock.remaining : undefined

  const labelParts = [`min. ${minRobux.toLocaleString('id-ID')}, kelipatan ${stepRobux.toLocaleString('id-ID')}`]
  if (stock) labelParts.push(`sisa stok: ${stock.remaining.toLocaleString('id-ID')}`)
  const label = `Robux (${labelParts.join(' • ')})`

  const minChars = String(minRobux).length
  const maxChars = maxRobux ? String(maxRobux).length : 7

  const modal = new ModalBuilder()
    .setCustomId(`modal_robux_amount:${method}`)
    .setTitle('Jumlah Robux')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('robux_amount')
          .setLabel(label.slice(0, 45)) // Discord label max 45 chars
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(maxRobux ? `${minRobux} – ${maxRobux} (kelipatan ${stepRobux})` : `Contoh: ${minRobux}, ${minRobux + stepRobux}`)
          .setMinLength(minChars)
          .setMaxLength(Math.max(minChars, maxChars))
          .setRequired(true)
      )
    )

  await interaction.showModal(modal)
}
