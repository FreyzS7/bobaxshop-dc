import {
  mysqlTable,
  varchar,
  boolean,
  decimal,
  timestamp,
  int,
  mysqlEnum,
  unique,
} from 'drizzle-orm/mysql-core'
import { randomUUID } from 'crypto'

// Tabel guilds
export const guilds = mysqlTable('guilds', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  setupDone: boolean('setup_done').default(false).notNull(),
  adminRoleId: varchar('admin_role_id', { length: 32 }),
  robuxRate: decimal('robux_rate', { precision: 10, scale: 2 }),
  robuxRateGamepass: decimal('robux_rate_gamepass', { precision: 10, scale: 2 }),
  robuxRateTransfer: decimal('robux_rate_transfer', { precision: 10, scale: 2 }),
  taxPercent: decimal('tax_percent', { precision: 5, scale: 2 }).default('30').notNull(),
  minRobux: int('min_robux').default(1000).notNull(),
  stepRobux: int('step_robux').default(500).notNull(),
  paymentMode: mysqlEnum('payment_mode', ['manual', 'midtrans']).default('manual').notNull(),
  enableCommunity: boolean('enable_community').default(true).notNull(),
  enableGamepass: boolean('enable_gamepass').default(true).notNull(),
  enableTransfer: boolean('enable_transfer').default(false).notNull(),
  robloxUserId: varchar('roblox_user_id', { length: 32 }).default('456687425'),
  qrisImageUrl: varchar('qris_image_url', { length: 1000 }),
  autoCancelMinutes: int('auto_cancel_minutes').default(360).notNull(),
  isOpen: boolean('is_open').default(true).notNull(),
  statusMessage: varchar('status_message', { length: 500 }),
  categoryId: varchar('category_id', { length: 32 }),
  chCommands: varchar('ch_commands', { length: 32 }),
  chLogs: varchar('ch_logs', { length: 32 }),
  chAnnounce: varchar('ch_announce', { length: 32 }),
  chOrder: varchar('ch_order', { length: 32 }),
  chBuy: varchar('ch_buy', { length: 32 }),
  chPaymentLog: varchar('ch_payment_log', { length: 32 }),
  pendingCatId: varchar('pending_cat_id', { length: 32 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tabel admins
export const admins = mysqlTable(
  'admins',
  {
    id: int('id').autoincrement().primaryKey(),
    guildId: varchar('guild_id', { length: 32 })
      .notNull()
      .references(() => guilds.id),
    discordUserId: varchar('discord_user_id', { length: 32 }).notNull(),
    addedBy: varchar('added_by', { length: 32 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [unique().on(t.guildId, t.discordUserId)]
)

// Tabel orders
export const orders = mysqlTable('orders', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  guildId: varchar('guild_id', { length: 32 })
    .notNull()
    .references(() => guilds.id),
  orderNumber: varchar('order_number', { length: 50 }).unique().notNull(),
  buyerId: varchar('buyer_id', { length: 32 }).notNull(),
  buyerUsername: varchar('buyer_username', { length: 100 }).notNull(),
  method: mysqlEnum('method', ['gamepass', 'community', 'transfer']).notNull(),
  robuxAmount: int('robux_amount').notNull(),
  robuxGross: int('robux_gross').notNull(),
  gamepassLink: varchar('gamepass_link', { length: 500 }),
  robloxUsername: varchar('roblox_username', { length: 100 }),
  priceIdr: int('price_idr').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  paymentStatus: mysqlEnum('payment_status', ['pending', 'paid', 'expired', 'failed'])
    .default('pending')
    .notNull(),
  orderStatus: mysqlEnum('order_status', [
    'waiting_payment',
    'paid',
    'processing',
    'completed',
    'cancelled',
    'refunded',
  ])
    .default('waiting_payment')
    .notNull(),
  midtransOrderId: varchar('midtrans_order_id', { length: 100 }).unique(),
  midtransSnapToken: varchar('midtrans_snap_token', { length: 500 }),
  pendingChannelId: varchar('pending_channel_id', { length: 32 }),
  orderChannelMsgId: varchar('order_channel_msg_id', { length: 32 }),
  processedBy: varchar('processed_by', { length: 32 }),
  proofImageUrl: varchar('proof_image_url', { length: 1000 }),
  notes: varchar('notes', { length: 1000 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tabel order_logs
export const orderLogs = mysqlTable('order_logs', {
  id: int('id').autoincrement().primaryKey(),
  orderId: varchar('order_id', { length: 36 })
    .notNull()
    .references(() => orders.id),
  action: varchar('action', { length: 50 }).notNull(),
  actor: varchar('actor', { length: 32 }),
  note: varchar('note', { length: 1000 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Tabel web_users
export const webUsers = mysqlTable('web_users', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: mysqlEnum('role', ['superadmin', 'viewer']).default('viewer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
