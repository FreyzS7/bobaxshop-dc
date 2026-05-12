import { createHash } from 'crypto'
import { CoreApi } from 'midtrans-client'
import { getEnv } from '@bobaxshop/config'

function getCoreApi() {
  const env = getEnv()
  return new CoreApi({
    isProduction: env.MIDTRANS_IS_PRODUCTION,
    serverKey: env.MIDTRANS_SERVER_KEY,
    clientKey: env.MIDTRANS_CLIENT_KEY,
  })
}

export interface QrisTransaction {
  midtransOrderId: string
  qrCodeUrl: string
  expiryTime: string
}

export async function createQrisTransaction(
  orderNumber: string,
  amount: number,
  customerName: string
): Promise<QrisTransaction> {
  const coreApi = getCoreApi()

  const response = await coreApi.charge({
    payment_type: 'qris',
    transaction_details: {
      order_id: orderNumber,
      gross_amount: amount,
    },
    customer_details: {
      first_name: customerName,
    },
    qris: {
      acquirer: 'gopay',
    },
  })

  const qrCodeUrl = (response.actions as any[])?.find(
    (a) => a.name === 'generate-qr-code'
  )?.url

  if (!qrCodeUrl) throw new Error('QR code URL tidak tersedia dari Midtrans')

  return {
    midtransOrderId: orderNumber,
    qrCodeUrl,
    expiryTime: response.expiry_time as string,
  }
}

export async function fetchQrCodeImage(qrCodeUrl: string): Promise<Buffer> {
  const env = getEnv()
  const auth = Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString('base64')

  const res = await fetch(qrCodeUrl, {
    headers: { Authorization: `Basic ${auth}` },
  })

  if (!res.ok) throw new Error(`Gagal fetch QR code image: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

export function verifyWebhookSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string
): string {
  const env = getEnv()
  return createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${env.MIDTRANS_SERVER_KEY}`)
    .digest('hex')
}
