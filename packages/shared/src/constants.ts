export const ORDER_STATUS = {
  WAITING_PAYMENT: 'waiting_payment',
  PAID: 'paid',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  EXPIRED: 'expired',
  FAILED: 'failed',
} as const

export const METHOD = {
  GAMEPASS: 'gamepass',
  COMMUNITY: 'community',
} as const

export const COLORS = {
  info: 0x5865f2,
  success: 0x57f287,
  warning: 0xfee75c,
  error: 0xed4245,
  pending: 0xeb459e,
} as const

export const TAX_PERCENT = 30
export const ORDER_EXPIRY_MINUTES = 15
export const PENDING_ORDER_TTL_MS = 10 * 60 * 1000 // 10 menit
