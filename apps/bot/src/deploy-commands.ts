import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../../.env') })
import { REST, Routes } from 'discord.js'
import { readdirSync } from 'fs'
import { join } from 'path'
import { getEnv } from '@bobaxshop/config'

const env = getEnv()
const commands: object[] = []

const foldersPath = join(__dirname, 'commands')
for (const folder of readdirSync(foldersPath)) {
  const folderPath = join(foldersPath, folder)
  const files = readdirSync(folderPath).filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
  for (const file of files) {
    const command = require(join(folderPath, file))
    if ('data' in command) commands.push(command.data.toJSON())
  }
}

const rest = new REST().setToken(env.DISCORD_TOKEN)

;(async () => {
  console.log(`📤 Mendaftarkan ${commands.length} slash commands...`)
  await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: commands })
  console.log('✅ Slash commands berhasil didaftarkan!')
})()
