import { type ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js'
import { getPendingOrder } from '../../utils/pendingOrders'

export async function handleInputRobloxUsername(interaction: ButtonInteraction) {
  const pending = getPendingOrder(interaction.user.id)
  if (!pending) {
    await interaction.reply({ content: '❌ Sesi habis. Mulai ulang dari tombol Beli Robux.', ephemeral: true })
    return
  }

  const modal = new ModalBuilder()
    .setCustomId('modal_roblox_username')
    .setTitle('👤 Username Roblox')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('roblox_username')
          .setLabel('Username Roblox (BUKAN Display Name)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Contoh: Builderman')
          .setMinLength(3)
          .setMaxLength(20)
          .setRequired(true)
      )
    )

  await interaction.showModal(modal)
}
