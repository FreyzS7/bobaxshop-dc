import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from 'discord.js'
import { requireAdmin } from '../../middleware/isAdmin'
import { getGuild } from '@bobaxshop/database'
import { buildBuyEmbed, buildBuyButtonRow } from '../../services/embedService'

export const data = new SlashCommandBuilder()
  .setName('setbuy')
  .setDescription('Kirim embed Buy ke channel #buy')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return

  await interaction.deferReply({ ephemeral: true })

  const guild = await getGuild(interaction.guild!.id)

  if (!guild?.setupDone) {
    await interaction.editReply('❌ Jalankan `/setup` terlebih dahulu.')
    return
  }
  if (!guild.chBuy) {
    await interaction.editReply('❌ Channel #buy tidak ditemukan di database.')
    return
  }
  if (!guild.robuxRate) {
    await interaction.editReply('❌ Set rate dulu dengan `/setrate` sebelum mengirim embed.')
    return
  }

  const buyChannel = interaction.guild!.channels.cache.get(guild.chBuy)
  if (!buyChannel?.isTextBased()) {
    await interaction.editReply('❌ Channel #buy tidak ditemukan di server.')
    return
  }

  const enabled = {
    community: guild.enableCommunity ?? true,
    gamepass: guild.enableGamepass ?? true,
    transfer: guild.enableTransfer ?? false,
  }

  await buyChannel.send({
    embeds: [buildBuyEmbed(
      Number(guild.robuxRate),
      guild.minRobux ?? 1000,
      guild.stepRobux ?? 500,
      guild.robuxRateGamepass ? Number(guild.robuxRateGamepass) : undefined,
      guild.robuxRateTransfer ? Number(guild.robuxRateTransfer) : undefined,
      enabled,
    )],
    components: [buildBuyButtonRow()],
  })

  await interaction.editReply('✅ Embed berhasil dikirim ke #buy.')
}
