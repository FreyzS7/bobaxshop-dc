import http from 'http'
import type { Client } from 'discord.js'
import { handleMidtransWebhook } from './routes/midtrans'
import { handleBotApi } from './routes/botApi'

export function startHttpServer(client: Client, port: number): http.Server {
  const server = http.createServer(async (req, res) => {
    const url = req.url ?? ''

    try {
      if (url === '/midtrans/webhook' && req.method === 'POST') {
        return handleMidtransWebhook(req, res, client)
      }

      if (url.startsWith('/api/') && req.method === 'POST') {
        return handleBotApi(req, res, client)
      }

      res.writeHead(404).end()
    } catch (err) {
      console.error('❌ HTTP server error:', err)
      res.writeHead(500).end()
    }
  })

  server.listen(port, () => {
    console.log(`🌐 HTTP server listening on port ${port}`)
    console.log(`   Midtrans webhook : POST /midtrans/webhook`)
    console.log(`   Bot internal API : POST /api/setup`)
  })

  return server
}
