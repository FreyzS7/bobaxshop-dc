import { createOrder, addOrderLog, getGuild } from '@bobaxshop/database'
import { calcRobuxGross, calcPrice } from '@bobaxshop/shared'
import type { PendingOrderState } from '../utils/pendingOrders'

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `BX-${date}-${rand}`
}

export async function createDraftOrder(state: PendingOrderState, paymentMethod: string) {
  const guild = await getGuild(state.guildId)
  if (!guild?.robuxRate) throw new Error('Rate belum diset')

  const rate = Number(guild.robuxRate)
  const robuxAmount = state.robuxAmount!
  const robuxGross = state.method === 'gamepass' ? calcRobuxGross(robuxAmount) : robuxAmount
  const priceIdr = calcPrice(robuxAmount, rate)

  const order = await createOrder({
    guildId: state.guildId,
    orderNumber: generateOrderNumber(),
    buyerId: state.buyerId,
    buyerUsername: state.buyerUsername,
    method: state.method,
    robuxAmount,
    robuxGross,
    gamepassLink: state.gamepassLink ?? null,
    robloxUsername: state.robloxUsername ?? null,
    priceIdr,
    paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'waiting_payment',
  })

  await addOrderLog(order.id, 'created', state.buyerId, `Order dibuat via ${state.method}`)

  return order
}
