import type { IncomingMessage, ServerResponse } from 'http'
import type { Client } from 'discord.js'
import { getEnv } from '@bobaxshop/config'
import { runSetup, teardownGuild } from '../../services/setupService'
import { getGuild } from '@bobaxshop/database'
import { buildBuyEmbed, buildBuyButtonRow } from '../../services/embedService'

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

  // POST /api/setbuy
  if (url === '/api/setbuy' && req.method === 'POST') {
    const body = await readBody(req)
    const { guildId } = JSON.parse(body)

    if (!guildId) {
      res.writeHead(400).end(JSON.stringify({ error: 'guildId required' }))
      return
    }

    const guild = await getGuild(guildId)
    if (!guild?.setupDone) {
      res.writeHead(400).end(JSON.stringify({ success: false, message: 'Setup belum selesai.' }))
      return
    }
    if (!guild.chBuy) {
      res.writeHead(400).end(JSON.stringify({ success: false, message: 'Channel #buy belum dikonfigurasi.' }))
      return
    }
    if (!guild.robuxRate) {
      res.writeHead(400).end(JSON.stringify({ success: false, message: 'Rate belum diset.' }))
      return
    }

    const discordGuild = client.guilds.cache.get(guildId)
    const buyChannel = discordGuild?.channels.cache.get(guild.chBuy)
    if (!buyChannel?.isTextBased()) {
      res.writeHead(400).end(JSON.stringify({ success: false, message: 'Channel #buy tidak ditemukan di Discord.' }))
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

    res.writeHead(200).end(JSON.stringify({ success: true, message: 'Embed berhasil dikirim ke #buy.' }))
    return
  }

  res.writeHead(404).end()
}
