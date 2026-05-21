import { type ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js'
import { setPendingOrder } from '../../utils/pendingOrders'
import { getGuild } from '@bobaxshop/database'

export async function handleMethodSelect(interaction: ButtonInteraction, method: 'gamepass' | 'community') {
  setPendingOrder(interaction.user.id, {
    guildId: interaction.guild!.id,
    buyerId: interaction.user.id,
    buyerUsername: interaction.user.username,
    method,
  })

  const guild = await getGuild(interaction.guild!.id)
  const minRobux = guild?.minRobux ?? 1000
  const stepRobux = guild?.stepRobux ?? 500

  // minLength/maxLength = jumlah karakter angka, bukan nilai
  const minChars = String(minRobux).length
  const maxChars = 7 // max 9.999.999

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
