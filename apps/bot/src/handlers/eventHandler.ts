import { readdirSync } from 'fs'
import { join } from 'path'
import { client } from '../client'

export async function loadEvents() {
  const eventsPath = join(__dirname, '..', 'events')
  const files = readdirSync(eventsPath).filter((f) => f.endsWith('.ts') || f.endsWith('.js'))

  for (const file of files) {
    const event = require(join(eventsPath, file))
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args))
    } else {
      client.on(event.name, (...args) => event.execute(...args))
    }
    console.log(`✅ Loaded event: ${event.name}`)
  }
}
