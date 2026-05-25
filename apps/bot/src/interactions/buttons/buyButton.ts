import { type ButtonInteraction, EmbedBuilder } from 'discord.js'
import { getGuild } from '@bobaxshop/database'
import { COLORS } from '@bobaxshop/shared'
import { buildMethodRow } from '../../services/embedService'

export async function handleBuyStart(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true })

  const guild = await getGuild(interaction.guild!.id)

  if (!guild?.isOpen) {
    await interaction.editReply({
      content: `🔴 Toko sedang **tutup**.${guild?.statusMessage ? `\n> ${guild.statusMessage}` : ''}`,
    })
    return
  }

  if (!guild.robuxRate) {
    await interaction.editReply({ content: '❌ Rate belum diset oleh admin.' })
    return
  }

  const enabled = {
    community: guild.enableCommunity ?? true,
    gamepass: guild.enableGamepass ?? true,
    transfer: guild.enableTransfer ?? false,
  }

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle('🛒 Pilih Metode Pembelian')
        .setDescription('Pilih metode yang ingin kamu gunakan:')
        .addFields(
          ...(enabled.gamepass ? [{ name: '🎮 Via Gamepass', value: 'Kamu buat gamepass di experience Roblox, lalu admin beli.', inline: false }] : []),
          ...(enabled.community ? [{ name: '👥 Via Community Join', value: 'Admin kirim Robux via community funds.', inline: false }] : []),
          ...(enabled.transfer ? [{ name: '💸 Via Robux Transfer', value: `Transfer Robux langsung ke akun Roblox seller. Wajib berteman dengan **${guild.robloxUserId ?? '456687425'}**.`, inline: false }] : []),
        ),
    ],
    components: [buildMethodRow(enabled)],
  })
}
