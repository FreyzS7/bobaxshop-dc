import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { requireAdmin } from '../../middleware/isAdmin'
import { getOrderByNumber } from '@bobaxshop/database'
import { verifyWebhookSignature } from '../../services/midtransService'
import { getEnv } from '@bobaxshop/config'
import { COLORS } from '@bobaxshop/shared'

export const data = new SlashCommandBuilder()
  .setName('mockpay')
  .setDescription('[SANDBOX] Simulate pembayaran berhasil untuk testing')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((opt) =>
    opt
      .setName('order')
      .setDescription('Order number (contoh: BX-20260512-1234)')
      .setRequired(true)
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true })

  if (!(await requireAdmin(interaction))) return

  const env = getEnv()
  if (env.MIDTRANS_IS_PRODUCTION) {
    await interaction.editReply({ content: '❌ Command ini hanya tersedia di mode sandbox.' })
    return
  }

  const orderNumber = interaction.options.getString('order', true).trim()
  const order = await getOrderByNumber(orderNumber)

  if (!order) {
    await interaction.editReply({ content: `❌ Order **${orderNumber}** tidak ditemukan.` })
    return
  }

  if (!order.midtransOrderId) {
    await interaction.editReply({ content: `❌ Order **${orderNumber}** belum punya Midtrans transaction ID. Pastikan order sudah dibuat via QRIS.` })
    return
  }

  if (order.orderStatus === 'completed' || order.orderStatus === 'cancelled' || order.orderStatus === 'refunded') {
    await interaction.editReply({ content: `⚠️ Order **${orderNumber}** sudah berstatus **${order.orderStatus}**.` })
    return
  }

  if (order.paymentStatus === 'paid') {
    await interaction.editReply({ content: `⚠️ Order **${orderNumber}** sudah paid.` })
    return
  }

  const grossAmount = String(order.priceIdr) + '.00'
  const statusCode = '200'
  const signature = verifyWebhookSignature(order.midtransOrderId, statusCode, grossAmount)

  const payload = {
    order_id: order.midtransOrderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signature,
    transaction_status: 'settlement',
    fraud_status: 'accept',
    payment_type: 'qris',
  }

  try {
    const webhookUrl = `${env.BOT_API_URL}/midtrans/webhook`
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      await interaction.editReply({ content: `❌ Webhook gagal: ${res.status} — ${text}` })
      return
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.success)
          .setTitle('🧪 Mock Payment Berhasil')
          .setDescription(`Webhook settlement dikirim untuk order **${orderNumber}**.\nBot akan memproses order seperti pembayaran nyata.`)
          .addFields({ name: '📦 Order', value: orderNumber, inline: true })
          .setFooter({ text: 'SANDBOX MODE' }),
      ],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await interaction.editReply({ content: `❌ Gagal kirim webhook: \`${msg}\`` })
  }
}
