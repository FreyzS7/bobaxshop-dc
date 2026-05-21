import { Events, type Message } from 'discord.js'
import { getOrderByPendingChannelId } from '@bobaxshop/database'
import { handleManualProof } from '../services/paymentCallbackService'

export const name = Events.MessageCreate
export const once = false

export async function execute(message: Message) {
  if (message.author.bot) return
  if (!message.guild) return

  // Cek apakah channel ini adalah proof channel dari order
  const order = await getOrderByPendingChannelId(message.channel.id)
  if (!order) return

  // Hanya proses dari buyer yang punya order
  if (order.buyerId !== message.author.id) return

  // Hanya proses jika masih waiting payment (belum diproses)
  if (order.paymentStatus !== 'pending') return

  // Tidak ada attachment — buyer kirim text saja
  if (message.attachments.size === 0) {
    await message.reply('📸 Kirim **screenshot/foto bukti transfer** kamu di sini ya, bukan teks.')
    return
  }

  const attachment = message.attachments.first()!
  if (!attachment.contentType?.startsWith('image/')) {
    await message.reply('⚠️ File tidak didukung. Kirim gambar **JPG/PNG** saja.')
    return
  }

  await message.react('⏳')

  try {
    await handleManualProof(message.client, order.id, attachment.url, message)
    await message.react('✅')
  } catch (err) {
    console.error('❌ handleManualProof error:', err)
    await message.react('❌')
  }
}
