import {
  pgTable,
  varchar,
  boolean,
  decimal,
  timestamp,
  serial,
  integer,
  uuid,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Enums
export const methodEnum = pgEnum('method', ['gamepass', 'community'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'expired', 'failed'])
export const orderStatusEnum = pgEnum('order_status', [
  'waiting_payment',
  'paid',
  'processing',
  'completed',
  'cancelled',
])
export const webRoleEnum = pgEnum('web_role', ['superadmin', 'viewer'])

// Tabel guilds
export const guilds = pgTable('guilds', {
  id: varchar('id').primaryKey(),
  name: varchar('name').notNull(),
  setupDone: boolean('setup_done').default(false).notNull(),
  adminRoleId: varchar('admin_role_id'),
  robuxRate: decimal('robux_rate', { precision: 10, scale: 2 }),
  taxPercent: decimal('tax_percent', { precision: 5, scale: 2 }).default('30').notNull(),
  isOpen: boolean('is_open').default(true).notNull(),
  statusMessage: varchar('status_message'),
  categoryId: varchar('category_id'),
  chCommands: varchar('ch_commands'),
  chLogs: varchar('ch_logs'),
  chAnnounce: varchar('ch_announce'),
  chOrder: varchar('ch_order'),
  chBuy: varchar('ch_buy'),
  pendingCatId: varchar('pending_cat_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tabel admins
export const admins = pgTable(
  'admins',
  {
    id: serial('id').primaryKey(),
    guildId: varchar('guild_id')
      .notNull()
      .references(() => guilds.id),
    discordUserId: varchar('discord_user_id').notNull(),
    addedBy: varchar('added_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [unique().on(t.guildId, t.discordUserId)]
)

// Tabel orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar('guild_id')
    .notNull()
    .references(() => guilds.id),
  orderNumber: varchar('order_number').unique().notNull(),
  buyerId: varchar('buyer_id').notNull(),
  buyerUsername: varchar('buyer_username').notNull(),
  method: methodEnum('method').notNull(),
  robuxAmount: integer('robux_amount').notNull(),
  robuxGross: integer('robux_gross').notNull(),
  gamepassLink: varchar('gamepass_link'),
  robloxUsername: varchar('roblox_username'),
  priceIdr: integer('price_idr').notNull(),
  paymentMethod: varchar('payment_method').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  orderStatus: orderStatusEnum('order_status').default('waiting_payment').notNull(),
  midtransOrderId: varchar('midtrans_order_id').unique(),
  midtransSnapToken: varchar('midtrans_snap_token'),
  pendingChannelId: varchar('pending_channel_id'),
  orderChannelMsgId: varchar('order_channel_msg_id'),
  processedBy: varchar('processed_by'),
  notes: varchar('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tabel order_logs
export const orderLogs = pgTable('order_logs', {
  id: serial('id').primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id),
  action: varchar('action').notNull(),
  actor: varchar('actor'),
  note: varchar('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Tabel web_users
export const webUsers = pgTable('web_users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email').unique().notNull(),
  passwordHash: varchar('password_hash').notNull(),
  name: varchar('name').notNull(),
  role: webRoleEnum('role').default('viewer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
