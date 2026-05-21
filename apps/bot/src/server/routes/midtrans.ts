import type { IncomingMessage, ServerResponse } from 'http'
import type { Client } from 'discord.js'
import { getOrderByMidtransId } from '@bobaxshop/database'
import { verifyWebhookSignature } from '../../services/midtransService'
import { handlePaymentSuccess, handlePaymentExpired, handlePaymentFailed } from '../../services/paymentCallbackService'

export async function handleMidtransWebhook(
  req: IncomingMessage,
  res: ServerResponse,
  client: Client
) {
  let body = ''
  req.on('data', (chunk: Buffer) => { body += chunk.toString() })
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body)
      const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = payload

      const expectedSig = verifyWebhookSignature(order_id, status_code, gross_amount)
      if (signature_key !== expectedSig) {
        console.warn(`⚠️ Midtrans signature mismatch: ${order_id}`)
        res.writeHead(403).end(JSON.stringify({ error: 'Invalid signature' }))
        return
      }

      console.log(`📩 Midtrans: ${order_id} → ${transaction_status}`)

      const needsOrder = ['settlement', 'capture', 'expire', 'cancel', 'deny', 'failure'].includes(transaction_status)
      const order = needsOrder ? await getOrderByMidtransId(order_id) : null

      if (!order && needsOrder) {
        console.warn(`⚠️ Order tidak ditemukan untuk ${order_id}`)
        res.writeHead(200).end(JSON.stringify({ ok: true }))
        return
      }

      // Skip non-settlement webhooks for manual payment orders or already-terminal orders
      const isManualOrder = order?.paymentMethod === 'qris_manual'
      const isTerminal = ['completed', 'cancelled', 'refunded'].includes(order?.orderStatus ?? '')

      if (
        (transaction_status === 'settlement' || transaction_status === 'capture') &&
        fraud_status !== 'deny'
      ) {
        await handlePaymentSuccess(client, order!.id)
      } else if (!isManualOrder && !isTerminal) {
        if (transaction_status === 'expire') {
          await handlePaymentExpired(client, order!.id)
        } else if (transaction_status === 'cancel') {
          await handlePaymentFailed(client, order!.id, 'cancel')
        } else if (transaction_status === 'deny' || fraud_status === 'deny') {
          await handlePaymentFailed(client, order!.id, 'deny')
        } else if (transaction_status === 'failure') {
          await handlePaymentFailed(client, order!.id, 'failure')
        }
      }
      // 'pending' → tidak perlu aksi, order sudah di waiting_payment

      res.writeHead(200).end(JSON.stringify({ ok: true }))
    } catch (err) {
      console.error('❌ Midtrans webhook error:', err)
      res.writeHead(500).end()
    }
  })
}
