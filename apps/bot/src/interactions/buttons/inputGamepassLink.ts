import { type ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js'
import { getPendingOrder } from '../../utils/pendingOrders'

export async function handleInputGamepassLink(interaction: ButtonInteraction) {
  const pending = getPendingOrder(interaction.user.id)
  if (!pending) {
    await interaction.reply({ content: '❌ Sesi habis. Mulai ulang dengan menekan tombol Beli Robux.', ephemeral: true })
    return
  }

  const modal = new ModalBuilder()
    .setCustomId('modal_gamepass_link')
    .setTitle('🔗 Link Gamepass Roblox')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('gamepass_link')
          .setLabel('Link gamepass kamu')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('https://www.roblox.com/game-pass/...')
          .setRequired(true)
      )
    )

  await interaction.showModal(modal)
}
