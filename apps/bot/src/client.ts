import { Client, GatewayIntentBits, Collection } from 'discord.js'
import type { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'

export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
})

// Attach commands collection ke client
;(client as any).commands = new Collection<string, Command>()

export { client }
