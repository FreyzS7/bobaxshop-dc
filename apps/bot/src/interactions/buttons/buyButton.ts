import { type ButtonInteraction, EmbedBuilder } from 'discord.js'
import { getGuild } from '@bobaxshop/database'
import { COLORS } from '@bobaxshop/shared'
import { buildMethodRow } from '../../services/embedService'

export async function handleBuyStart(interaction: ButtonInteraction) {
  const guild = await getGuild(interaction.guild!.id)

  if (!guild?.isOpen) {
    await interaction.reply({
      content: `🔴 Toko sedang **tutup**.${guild?.statusMessage ? `\n> ${guild.statusMessage}` : ''}`,
      ephemeral: true,
    })
    return
  }

  if (!guild.robuxRate) {
    await interaction.reply({ content: '❌ Rate belum diset oleh admin.', ephemeral: true })
    return
  }

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle('🛒 Pilih Metode Pembelian')
        .setDescription('Pilih metode yang ingin kamu gunakan:')
        .addFields(
          { name: '🎮 Via Gamepass', value: 'Kamu buat gamepass di Roblox, lalu admin beli.', inline: false },
          { name: '👥 Via Community Join', value: 'Admin kirim Robux via community.', inline: false },
        ),
    ],
    components: [buildMethodRow()],
    ephemeral: true,
  })
}
