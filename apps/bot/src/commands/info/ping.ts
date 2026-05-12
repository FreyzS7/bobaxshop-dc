import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Cek apakah bot online')

export async function execute(interaction: ChatInputCommandInteraction) {
  const latency = Date.now() - interaction.createdTimestamp
  await interaction.reply(`🏓 Pong! Latency: **${latency}ms**`)
}
