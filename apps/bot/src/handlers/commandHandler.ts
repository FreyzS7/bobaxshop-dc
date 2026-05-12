import { readdirSync } from 'fs'
import { join } from 'path'
import { client } from '../client'
import type { Command } from '../client'

export async function loadCommands() {
  const commands = (client as any).commands
  const foldersPath = join(__dirname, '..', 'commands')

  for (const folder of readdirSync(foldersPath)) {
    const folderPath = join(foldersPath, folder)
    const files = readdirSync(folderPath).filter((f) => f.endsWith('.ts') || f.endsWith('.js'))

    for (const file of files) {
      const command: Command = require(join(folderPath, file))
      if ('data' in command && 'execute' in command) {
        commands.set(command.data.name, command)
        console.log(`✅ Loaded command: ${command.data.name}`)
      }
    }
  }
}
