import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../../.env') })
import { getEnv } from '@bobaxshop/config'
import { client } from './client'
import { loadCommands } from './handlers/commandHandler'
import { loadEvents } from './handlers/eventHandler'
import { startHttpServer } from './server'

const env = getEnv()

async function main() {
  await loadCommands()
  await loadEvents()
  startHttpServer(client, env.WEBHOOK_PORT)
  await client.login(env.DISCORD_TOKEN)
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
