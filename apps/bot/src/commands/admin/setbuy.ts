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

  const guild = await getGuild(interaction.guild!.id)

  if (!guild?.setupDone) {
    await interaction.reply({ content: '❌ Jalankan `/setup` terlebih dahulu.', ephemeral: true })
    return
  }
  if (!guild.chBuy) {
    await interaction.reply({ content: '❌ Channel #buy tidak ditemukan di database.', ephemeral: true })
    return
  }
  if (!guild.robuxRate) {
    await interaction.reply({ content: '❌ Set rate dulu dengan `/setrate` sebelum mengirim embed.', ephemeral: true })
    return
  }

  const buyChannel = interaction.guild!.channels.cache.get(guild.chBuy)
  if (!buyChannel?.isTextBased()) {
    await interaction.reply({ content: '❌ Channel #buy tidak ditemukan di server.', ephemeral: true })
    return
  }

  await buyChannel.send({
    embeds: [buildBuyEmbed(Number(guild.robuxRate))],
    components: [buildBuyButtonRow()],
  })

  await interaction.reply({ content: '✅ Embed berhasil dikirim ke #buy.', ephemeral: true })
}
