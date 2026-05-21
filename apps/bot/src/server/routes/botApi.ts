import type { IncomingMessage, ServerResponse } from 'http'
import type { Client } from 'discord.js'
import { getEnv } from '@bobaxshop/config'
import { runSetup, teardownGuild } from '../../services/setupService'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => resolve(body))
  })
}

function verifySecret(req: IncomingMessage): boolean {
  const env = getEnv()
  const auth = req.headers['authorization']
  return auth === `Bearer ${env.BOT_API_SECRET}`
}

export async function handleBotApi(
  req: IncomingMessage,
  res: ServerResponse,
  client: Client
) {
  if (!verifySecret(req)) {
    res.writeHead(401).end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }

  const url = req.url ?? ''

  // POST /api/setup
  if (url === '/api/setup' && req.method === 'POST') {
    const body = await readBody(req)
    const { guildId } = JSON.parse(body)

    if (!guildId) {
      res.writeHead(400).end(JSON.stringify({ error: 'guildId required' }))
      return
    }

    const result = await runSetup(client, guildId)
    res.writeHead(result.success ? 200 : 400).end(JSON.stringify(result))
    return
  }

  // POST /api/guild/kick
  if (url === '/api/guild/kick' && req.method === 'POST') {
    const body = await readBody(req)
    const { guildId } = JSON.parse(body)

    if (!guildId) {
      res.writeHead(400).end(JSON.stringify({ error: 'guildId required' }))
      return
    }

    const result = await teardownGuild(client, guildId)
    res.writeHead(result.success ? 200 : 400).end(JSON.stringify(result))
    return
  }

  res.writeHead(404).end()
}
