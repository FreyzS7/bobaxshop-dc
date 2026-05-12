import http from 'http'
import type { Client } from 'discord.js'
import { getOrderByMidtransId } from '@bobaxshop/database'
import { verifyWebhookSignature } from './midtransService'
import { handlePaymentSuccess } from './paymentCallbackService'

export function startWebhookServer(client: Client, port: number): http.Server {
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/midtrans/webhook') {
      res.writeHead(404).end()
      return
    }

    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body)
        const {
          order_id,
          status_code,
          gross_amount,
          signature_key,
          transaction_status,
          fraud_status,
        } = payload

        // Verifikasi signature Midtrans
        const expectedSig = verifyWebhookSignature(order_id, status_code, gross_amount)
        if (signature_key !== expectedSig) {
          console.warn(`⚠️ Midtrans webhook signature mismatch untuk order ${order_id}`)
          res.writeHead(403).end(JSON.stringify({ error: 'Invalid signature' }))
          return
        }

        console.log(`📩 Midtrans webhook: ${order_id} — ${transaction_status} (fraud: ${fraud_status})`)

        // Payment berhasil: settlement atau capture, bukan fraud
        if (
          (transaction_status === 'settlement' || transaction_status === 'capture') &&
          fraud_status !== 'deny'
        ) {
          const order = await getOrderByMidtransId(order_id)
          if (order) {
            await handlePaymentSuccess(client, order.id)
          } else {
            console.warn(`⚠️ Order dengan midtransOrderId ${order_id} tidak ditemukan`)
          }
        }

        res.writeHead(200).end(JSON.stringify({ ok: true }))
      } catch (err) {
        console.error('❌ Webhook handler error:', err)
        res.writeHead(500).end()
      }
    })
  })

  server.listen(port, () => {
    console.log(`🌐 Midtrans webhook server listening on port ${port}`)
    console.log(`   → Notification URL: http://YOUR_PUBLIC_IP:${port}/midtrans/webhook`)
  })

  return server
}
