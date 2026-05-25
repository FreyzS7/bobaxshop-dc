export interface PendingOrderState {
  guildId: string
  buyerId: string
  buyerUsername: string
  method: 'gamepass' | 'community' | 'transfer'
  robuxAmount?: number
  robuxGross?: number
  gamepassLink?: string
  robloxUsername?: string
  priceIdr?: number
}

const pendingOrders = new Map<string, PendingOrderState>()
const timers = new Map<string, NodeJS.Timeout>()

const TTL_MS = 10 * 60 * 1000 // 10 menit

export function setPendingOrder(userId: string, data: PendingOrderState) {
  clearPendingOrder(userId)
  pendingOrders.set(userId, data)
  const timer = setTimeout(() => pendingOrders.delete(userId), TTL_MS)
  timers.set(userId, timer)
}

export function getPendingOrder(userId: string): PendingOrderState | undefined {
  return pendingOrders.get(userId)
}

export function updatePendingOrder(userId: string, updates: Partial<PendingOrderState>) {
  const existing = pendingOrders.get(userId)
  if (!existing) return
  pendingOrders.set(userId, { ...existing, ...updates })
}

export function clearPendingOrder(userId: string) {
  pendingOrders.delete(userId)
  const timer = timers.get(userId)
  if (timer) {
    clearTimeout(timer)
    timers.delete(userId)
  }
}
