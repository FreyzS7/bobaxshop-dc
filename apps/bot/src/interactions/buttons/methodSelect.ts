import { type ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js'
import { setPendingOrder } from '../../utils/pendingOrders'

export async function handleMethodSelect(interaction: ButtonInteraction, method: 'gamepass' | 'community') {
  setPendingOrder(interaction.user.id, {
    guildId: interaction.guild!.id,
    buyerId: interaction.user.id,
    buyerUsername: interaction.user.username,
    method,
  })

  const modal = new ModalBuilder()
    .setCustomId(`modal_robux_amount:${method}`)
    .setTitle('Jumlah Robux')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('robux_amount')
          .setLabel('Jumlah Robux (min. 1000, kelipatan 500)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Contoh: 1000, 1500, 2000')
          .setMinLength(4)
          .setMaxLength(7)
          .setRequired(true)
      )
    )

  await interaction.showModal(modal)
}
