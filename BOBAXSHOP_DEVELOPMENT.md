# BobaxShop — Discord Bot + Web Dashboard
## Complete Development Guide for Claude Code

---

## 📐 System Architecture Overview

```
bobaxshop/
├── apps/
│   ├── bot/                    # Discord Bot (discord.js v14)
│   └── web/                    # Next.js Dashboard
├── packages/
│   ├── database/               # Shared DB schema, migrations, queries
│   ├── shared/                 # Shared types, constants, utils
│   └── config/                 # Shared env config loader
├── docker-compose.yml          # PostgreSQL local
├── .env                        # Root env (shared)
└── package.json                # Turborepo workspace root
```

**Monorepo** menggunakan **Turborepo** + **pnpm workspaces**.  
Satu database PostgreSQL lokal digunakan oleh bot dan web sekaligus.

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Bot | discord.js v14, Node.js |
| Web | Next.js 14 (App Router) |
| Auth | NextAuth.js v5 (Credentials Provider) |
| Database | PostgreSQL (local) |
| ORM | Drizzle ORM |
| UI Dashboard | shadcn/ui + Tailwind CSS |
| Payment | Midtrans (QRIS wajib) |
| Monorepo | Turborepo + pnpm |
| Queue (opsional) | BullMQ + Redis (untuk webhook payment retry) |

---

## 🗄️ Database Schema

### Tabel `guilds`
```sql
id              VARCHAR PRIMARY KEY   -- Discord Guild ID
name            VARCHAR
setup_done      BOOLEAN DEFAULT false
admin_role_id   VARCHAR               -- Role "Administration" ID
robux_rate      DECIMAL               -- Harga IDR per 1 Robux (after tax)
tax_percent     DECIMAL DEFAULT 30    -- Tax Roblox (default 30%)
is_open         BOOLEAN DEFAULT true  -- Status toko (open/closed/busy)
status_message  VARCHAR               -- Pesan custom status
category_id     VARCHAR               -- ID category "BobaxShop"
ch_commands     VARCHAR               -- Channel ID #commands
ch_logs         VARCHAR               -- Channel ID #logs
ch_announce     VARCHAR               -- Channel ID #announce
ch_order        VARCHAR               -- Channel ID #order
ch_buy          VARCHAR               -- Channel ID #buy
pending_cat_id  VARCHAR               -- Category ID "Pending Orders"
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Tabel `admins`
```sql
id              SERIAL PRIMARY KEY
guild_id        VARCHAR REFERENCES guilds(id)
discord_user_id VARCHAR
added_by        VARCHAR               -- Discord user ID yang menambahkan
created_at      TIMESTAMP
UNIQUE(guild_id, discord_user_id)
```

### Tabel `orders`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
guild_id        VARCHAR REFERENCES guilds(id)
order_number    VARCHAR UNIQUE        -- Nomor order human-readable (BX-YYYYMMDD-XXXX)
buyer_id        VARCHAR               -- Discord user ID
buyer_username  VARCHAR
method          ENUM('gamepass','community')
robux_amount    INTEGER               -- Robux yang diminta buyer (after tax)
robux_gross     INTEGER               -- Robux yang harus di-set di gamepass (before tax)
gamepass_link   VARCHAR NULLABLE      -- Jika method gamepass
price_idr       INTEGER               -- Harga yang harus dibayar (IDR)
payment_method  VARCHAR               -- qris, bank_transfer, dll
payment_status  ENUM('pending','paid','expired','failed') DEFAULT 'pending'
order_status    ENUM('waiting_payment','paid','processing','completed','cancelled') DEFAULT 'waiting_payment'
midtrans_order_id VARCHAR UNIQUE
midtrans_snap_token VARCHAR NULLABLE
pending_channel_id VARCHAR NULLABLE   -- ID channel pending order (dihapus setelah selesai)
order_channel_msg_id VARCHAR NULLABLE -- Message ID embed di #order
processed_by    VARCHAR NULLABLE      -- Discord user ID admin yang proses
notes           VARCHAR NULLABLE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Tabel `order_logs`
```sql
id              SERIAL PRIMARY KEY
order_id        UUID REFERENCES orders(id)
action          VARCHAR               -- 'created','paid','processing','completed','cancelled','dm_sent','error'
actor           VARCHAR NULLABLE      -- Discord user ID atau 'system'
note            VARCHAR NULLABLE
created_at      TIMESTAMP
```

### Tabel `web_users`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           VARCHAR UNIQUE
password_hash   VARCHAR
name            VARCHAR
role            ENUM('superadmin','viewer') DEFAULT 'viewer'
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## 🔐 Security Requirements

- Semua env variable wajib divalidasi saat startup (pakai `zod`)
- Password web dashboard di-hash dengan **bcrypt** (cost factor 12)
- Midtrans webhook wajib verifikasi **signature key** sebelum diproses
- Semua query database menggunakan **prepared statements** via Drizzle ORM (no raw string interpolation)
- Bot hanya menerima interaction dari guild yang sudah terdaftar di database
- Command sensitif hanya bisa dijalankan oleh user yang punya role Administration atau terdaftar di tabel `admins`
- Rate limiting pada endpoint webhook dan API
- HTTPS wajib di production

---

## 📦 Package: `packages/database`

Berisi:
- Drizzle schema (`schema.ts`)
- Migration files
- Query functions (tidak boleh ada raw SQL di apps)
- Type exports

```ts
// Contoh export
export { db } from './client'
export * from './schema'
export * from './queries/orders'
export * from './queries/guilds'
export * from './queries/admins'
```

---

## 📦 Package: `packages/shared`

Berisi:
- TypeScript types/interfaces
- Constants (ORDER_STATUS, PAYMENT_STATUS, dll)
- Utility functions (format IDR, kalkulasi tax, generate order number)
- Zod schemas untuk validasi input

---

## 🤖 Bot Structure (`apps/bot`)

```
apps/bot/src/
├── index.ts                    # Entry point, login bot
├── client.ts                   # Discord Client instance
├── handlers/
│   ├── commandHandler.ts       # Load & register slash commands
│   ├── interactionHandler.ts   # Route interactions (command/button/modal/select)
│   └── eventHandler.ts         # Load events
├── commands/
│   ├── admin/
│   │   ├── setup.ts            # /setup — buat category & channels
│   │   ├── addAdmin.ts         # /addadmin @user
│   │   ├── removeAdmin.ts      # /removeadmin @user
│   │   ├── setRate.ts          # /setrate <harga per robux>
│   │   ├── setStatus.ts        # /setstatus <open|closed|busy> [pesan]
│   │   └── setbuy.ts           # /setbuy — kirim embed Buy ke #buy
│   └── info/
│       └── ping.ts
├── interactions/
│   ├── buttons/
│   │   ├── buyButton.ts        # Handler tombol Buy
│   │   ├── methodSelect.ts     # Handler pilih Gamepass/Community
│   │   ├── orderAction.ts      # Handler reaction/button admin (selesai/pending/cancel)
│   │   └── paymentSelect.ts    # Handler pilih payment method
│   ├── modals/
│   │   ├── robuxAmountModal.ts # Input nominal robux
│   │   └── gampassLinkModal.ts # Input link gamepass
│   └── selectMenus/
│       └── paymentMethodMenu.ts
├── services/
│   ├── orderService.ts         # Bussiness logic order
│   ├── midtransService.ts      # Midtrans API calls
│   ├── channelService.ts       # Create/delete pending channels
│   ├── embedService.ts         # Build semua embed message
│   ├── dmService.ts            # Kirim DM ke buyer
│   └── logService.ts           # Kirim log ke #logs channel
├── events/
│   ├── ready.ts
│   ├── interactionCreate.ts
│   └── guildCreate.ts
├── middleware/
│   └── isAdmin.ts              # Guard: cek role Administration atau tabel admins
└── utils/
    └── permissions.ts
```

---

## 🌐 Web Structure (`apps/web`)

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar + auth guard
│   │   ├── page.tsx            # Overview stats
│   │   ├── orders/
│   │   │   ├── page.tsx        # Order history table
│   │   │   └── [id]/page.tsx   # Detail order
│   │   ├── guilds/
│   │   │   └── page.tsx        # List server yang pakai bot
│   │   └── settings/
│   │       └── page.tsx        # Manage web users
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── webhooks/
│       │   └── midtrans/route.ts   # Midtrans payment notification
│       └── internal/
│           └── stats/route.ts
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── OrderTable.tsx
│   │   ├── RecentOrders.tsx
│   │   └── GuildCard.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Header.tsx
├── lib/
│   ├── auth.ts                 # NextAuth config
│   └── api.ts                  # Internal fetch helpers
└── middleware.ts               # Protect dashboard routes
```

---

## 🛒 Alur Pembelian — Detail Flow

### Step 1: Setup Server (Admin)
```
Admin run /setup
→ Bot cek guild sudah di DB, jika belum insert
→ Bot buat Category "BobaxShop"
→ Bot buat channels: #commands, #logs, #announce, #order, #buy
→ Bot buat Category "Pending Orders"
→ Set permission:
   - #buy: everyone bisa read, tidak bisa send message
   - #order, #commands, #logs: hanya role Administration
   - Pending Orders: hidden dari everyone
→ Simpan semua channel ID ke DB (guilds table)
→ Kirim sukses embed ke #commands
```

### Step 2: Admin Setup Buy Embed (Admin)
```
Admin run /setbuy
→ Bot kirim embed ke #buy berisi:
   - Deskripsi layanan jual beli Robux
   - Harga rate saat ini (IDR per Robux)
   - Info metode: Gamepass / Community
   - Tombol: [🛒 Beli Robux]
```

### Step 3: Buyer Klik Buy
```
Buyer klik [🛒 Beli Robux]
→ Bot cek guild.is_open, jika false → ephemeral "Toko sedang tutup"
→ Bot kirim ephemeral message dengan 2 tombol:
   [🎮 Via Gamepass] [👥 Via Community Join]
```

### Step 4: Pilih Metode
```
Buyer pilih metode
→ Bot tampilkan Modal: "Masukkan jumlah Robux yang ingin dibeli"
   - Input: nominal (integer, min 100)
```

### Step 5: Input Nominal
```
Buyer submit nominal (contoh: 1000 Robux)
→ Bot hitung:
   - Jika Gamepass: robux_gross = ceil(1000 / 0.70) = 1429 Robux (yang harus di-set di gamepass)
   - price_idr = robux_amount * guild.robux_rate
→ Jika Gamepass:
   Bot tampilkan Modal: "Masukkan link gamepass Roblox kamu"
   - Buyer input link gamepass
→ Bot simpan data sementara (pakai in-memory Map atau Redis dengan TTL 10 menit)
→ Bot tampilkan Select Menu: Pilih payment method
   - QRIS
   - Transfer Bank (BCA, Mandiri, dll) — sesuai yang diaktifkan di Midtrans
```

### Step 6: Pilih Payment
```
Buyer pilih payment method
→ Bot create order di DB (status: 'waiting_payment')
→ Bot hit Midtrans API: create transaction (Snap token)
→ Bot kirim ephemeral embed "Waiting for Payment":
   - Order ID: BX-YYYYMMDD-XXXX
   - Robux: 1.000
   - Total: Rp XX.XXX
   - Metode: QRIS / Bank Transfer
   - QR Code / VA Number
   - Expired: 15 menit
   - Status: ⏳ Menunggu Pembayaran
→ Log ke #logs: "Order baru dibuat: BX-XXX oleh @buyer"
```

### Step 7: Payment Webhook (Midtrans → Web)
```
Midtrans kirim POST ke /api/webhooks/midtrans
→ Verifikasi signature key
→ Update order status di DB: 'paid'
→ Bot dipanggil (via internal event atau polling):
   → Buat channel baru di Category "Pending Orders": #order-username-BX-XXX
   → Set permission: hanya role Administration + bot bisa lihat
   → Kirim embed ke #order:
      - Judul: 📦 Order Baru — BX-XXX
      - Buyer: @username (ID)
      - Metode: Gamepass / Community
      - Robux: 1.000 (buyer terima) / 1.429 (set di gamepass)
      - Link Gamepass: [link] (jika gamepass)
      - Payment: QRIS ✅
      - Total: Rp XX.XXX
      - Bukti: [gambar otomatis dari Midtrans jika ada]
      - Buttons: [✅ Selesai] [⏳ Pending] [❌ Cancel]
   → Update order: pending_channel_id, order_channel_msg_id
   → Kirim DM ke buyer: "Pembayaran diterima! Order BX-XXX sedang diproses admin."
   → Log ke #logs
```

### Step 8: Admin Proses Order
```
Admin klik salah satu button di embed #order:

[✅ Selesai]:
→ Update order_status: 'completed', processed_by: admin_id
→ Kirim DM ke buyer:
   "✅ Order BX-XXX Selesai!
   Robux 1.000 sudah dikirim.
   Terima kasih sudah berbelanja di BobaxShop!"
→ Hapus channel di Pending Orders
→ Log ke #logs: "Order BX-XXX diselesaikan oleh @admin"
→ Disable semua button di embed #order (edit message)

[⏳ Pending]:
→ Update order_status: 'processing'
→ Kirim DM ke buyer: "⏳ Order BX-XXX sedang diproses oleh admin."
→ Log ke #logs

[❌ Cancel]:
→ Update order_status: 'cancelled'
→ Kirim DM ke buyer:
   "❌ Order BX-XXX dibatalkan.
   Jika kamu sudah membayar, silakan hubungi admin untuk refund."
→ Hapus channel di Pending Orders
→ Log ke #logs: "Order BX-XXX dibatalkan oleh @admin"
→ Disable semua button di embed #order
```

---

## 💳 Midtrans Integration

### Config
```ts
// Gunakan Midtrans Node.js SDK
// Mode: sandbox untuk dev, production untuk live
// Wajib aktifkan: QRIS, minimal 1 bank transfer

const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
})
```

### Create Transaction
```ts
// Di orderService.ts
const parameter = {
  transaction_details: {
    order_id: order.order_number,  // BX-YYYYMMDD-XXXX
    gross_amount: order.price_idr,
  },
  customer_details: {
    first_name: order.buyer_username,
  },
  enabled_payments: ['qris', 'bca_va', 'mandiri_bill'],
  expiry: {
    unit: 'minutes',
    duration: 15,
  },
}
```

### Webhook Verification
```ts
// WAJIB: verifikasi sebelum proses apapun
const expectedSignature = crypto
  .createHash('sha512')
  .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
  .digest('hex')

if (expectedSignature !== req.body.signature_key) {
  return res.status(401).json({ message: 'Invalid signature' })
}
```

---

## ⚙️ Bot Commands Reference

| Command | Permission | Deskripsi |
|---|---|---|
| `/setup` | Administration | Setup category & channels BobaxShop |
| `/setbuy` | Administration | Kirim embed Buy ke #buy |
| `/setrate <amount>` | Administration | Set harga IDR per 1 Robux |
| `/setstatus <open\|closed\|busy> [pesan]` | Administration | Update status toko & kirim ke #announce |
| `/addadmin @user` | Administration | Tambah admin ke tabel admins |
| `/removeadmin @user` | Administration | Hapus admin |
| `/listadmin` | Administration | Lihat daftar admin |
| `/orderinfo <order_id>` | Administration | Lihat detail order |

---

## 🌐 Web Dashboard Pages

### `/login`
- Form email + password
- Redirect ke `/` jika sudah auth

### `/` (Overview)
- Total orders hari ini / minggu / bulan
- Revenue hari ini / bulan
- Order by status (chart)
- Recent 5 orders

### `/orders`
- Table semua order dengan filter: status, guild, tanggal
- Search by order number / buyer username
- Pagination
- Klik baris → detail order

### `/orders/[id]`
- Detail lengkap order
- Timeline log (order_logs)
- Status badge

### `/guilds`
- List semua guild yang pakai bot
- Status: open/closed/busy
- Total order per guild

### `/settings`
- Manage web users (superadmin only)
- Create / delete web user

---

## 🔌 Bot ↔ Web Communication

Karena monorepo dan satu database, komunikasi dilakukan via **shared database** (tidak perlu REST API antar bot dan web).

- Web baca/tulis langsung ke PostgreSQL via `packages/database`
- Bot baca/tulis langsung ke PostgreSQL via `packages/database`
- Webhook Midtrans masuk ke **web** (`/api/webhooks/midtrans`)
- Setelah web update DB, bot di-trigger via **polling ringan** (setInterval cek order `paid` yang belum diproses) ATAU via **Redis pub/sub** jika ingin real-time

**Rekomendasi**: Gunakan polling sederhana dulu (cek setiap 5 detik order berstatus `paid` tapi belum ada `pending_channel_id`), upgrade ke Redis pub/sub di fase berikutnya.

---

## 🚀 Development Phases

---

### PHASE 1 — Foundation & Database
**Goal**: Monorepo siap, database running, schema selesai

**Tasks**:
- [ ] Init Turborepo + pnpm workspace
- [ ] Setup `packages/database`: Drizzle ORM + PostgreSQL local (docker-compose)
- [ ] Buat semua schema (guilds, admins, orders, order_logs, web_users)
- [ ] Jalankan migration
- [ ] Setup `packages/shared`: types, constants, utils (kalkulasi tax, format IDR, generate order number)
- [ ] Setup `packages/config`: env loader + zod validation
- [ ] Root `.env` dengan semua variable

**Env Variables Needed**:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/bobaxshop
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
BOT_WEBHOOK_SECRET=         # internal secret jika pakai HTTP trigger
```

---

### PHASE 2 — Discord Bot Core
**Goal**: Bot online, command handler jalan, /setup berfungsi

**Tasks**:
- [ ] Init `apps/bot`, install discord.js v14
- [ ] Setup client, event handler, command handler (auto-load)
- [ ] Implement `ready` event
- [ ] Implement `/setup` command:
  - Buat category + channels dengan permission yang benar
  - Simpan ke DB
- [ ] Implement middleware `isAdmin` (cek role Administration + tabel admins)
- [ ] Implement `/addadmin`, `/removeadmin`, `/listadmin`
- [ ] Implement `/setrate`
- [ ] Implement `/setstatus` + kirim update ke #announce
- [ ] Log semua action ke #logs

---

### PHASE 3 — Buy Flow (Bot)
**Goal**: Alur pembelian end-to-end di Discord berfungsi (tanpa payment dulu)

**Tasks**:
- [ ] Implement `/setbuy` — kirim embed ke #buy
- [ ] Implement `buyButton` interaction handler
- [ ] Implement method select (Gamepass / Community)
- [ ] Implement modal input nominal Robux
- [ ] Implement kalkulasi tax (robux_gross = ceil(amount / 0.70))
- [ ] Implement modal input link gamepass (jika Gamepass)
- [ ] Implement select menu payment method
- [ ] Simpan state sementara order (in-memory Map dengan TTL)
- [ ] Buat draft order di DB (status: waiting_payment)
- [ ] Kirim ephemeral "Waiting for Payment" embed

---

### PHASE 4 — Midtrans Integration
**Goal**: Payment berfungsi, webhook diterima, order update otomatis

**Tasks**:
- [ ] Setup Midtrans SDK di `apps/bot/services/midtransService.ts`
- [ ] Create transaction saat buyer pilih payment
- [ ] Tampilkan Snap token / VA / QRIS di ephemeral embed
- [ ] Setup Next.js minimal untuk webhook endpoint: `POST /api/webhooks/midtrans`
- [ ] Verifikasi signature Midtrans
- [ ] Update order status ke `paid` di DB
- [ ] Bot polling: deteksi order `paid` yang belum ada `pending_channel_id`
- [ ] Bot buat channel di Pending Orders
- [ ] Bot kirim embed ke #order dengan buttons admin
- [ ] Bot kirim DM ke buyer "Pembayaran diterima"
- [ ] Log ke #logs

---

### PHASE 5 — Admin Order Processing
**Goal**: Admin bisa proses order via button, buyer terima DM

**Tasks**:
- [ ] Implement `orderAction` button handler (Selesai / Pending / Cancel)
- [ ] Update order_status di DB sesuai action
- [ ] Kirim DM ke buyer sesuai status
- [ ] Hapus channel Pending Orders (untuk Selesai & Cancel)
- [ ] Edit embed di #order: disable buttons setelah action
- [ ] Insert ke order_logs setiap perubahan status
- [ ] Log ke #logs

---

### PHASE 6 — Web Dashboard
**Goal**: Dashboard berfungsi dengan auth dan statistik

**Tasks**:
- [ ] Init `apps/web` Next.js 14 App Router
- [ ] Setup shadcn/ui + Tailwind CSS
- [ ] Setup NextAuth.js Credentials Provider
- [ ] Buat tabel `web_users` seed (superadmin awal)
- [ ] Implement `/login` page
- [ ] Protect dashboard routes via middleware
- [ ] Implement layout dashboard (sidebar, header)
- [ ] Implement halaman Overview (stats cards + chart)
- [ ] Implement halaman Orders (table + filter + pagination)
- [ ] Implement halaman Order Detail + timeline log
- [ ] Implement halaman Guilds
- [ ] Implement halaman Settings (manage web users)

---

### PHASE 7 — Polish & Security Hardening
**Goal**: Production-ready

**Tasks**:
- [ ] Rate limiting pada webhook dan API endpoints
- [ ] Input validation semua command dan modal (zod)
- [ ] Error handling global di bot (uncaughtException, unhandledRejection)
- [ ] Error handling di webhook (retry idempotency — cek jika order sudah diproses)
- [ ] Tambah index DB pada kolom yang sering di-query (guild_id, order_status, buyer_id)
- [ ] Environment variable validation saat startup (zod)
- [ ] Logging structured (pino atau winston)
- [ ] README.md setup guide
- [ ] Seed script: buat superadmin web pertama

---

## 📋 Additional Notes untuk Claude Code

### Kalkulasi Tax Robux
```ts
// packages/shared/utils/robux.ts
export function calcRobuxGross(robuxNet: number): number {
  // Buyer set gamepass harga ini agar after 30% tax, seller terima robuxNet
  return Math.ceil(robuxNet / 0.70)
}

export function calcPrice(robuxNet: number, ratePerRobux: number): number {
  return robuxNet * ratePerRobux
}
```

### Order Number Format
```ts
// BX-20240115-0001
export function generateOrderNumber(seq: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `BX-${date}-${String(seq).padStart(4, '0')}`
}
```

### Bot Permission Setup untuk /setup
```ts
// #buy: everyone bisa read, tidak bisa send/react
// #order, #commands, #logs: hanya role Administration
// Category "Pending Orders": 
//   - @everyone: deny ViewChannel
//   - role Administration: allow ViewChannel, ManageChannels, SendMessages

// Bot invite permission: Administrator (8)
// Invite URL: https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### Embed Colors Convention
```ts
const COLORS = {
  info: 0x5865F2,      // Discord Blurple
  success: 0x57F287,   // Green
  warning: 0xFEE75C,   // Yellow
  error: 0xED4245,     // Red
  pending: 0xEB459E,   // Pink
}
```

### Idempotency Webhook
```ts
// Selalu cek sebelum proses webhook
const existing = await db.query.orders.findFirst({
  where: eq(orders.midtrans_order_id, orderId)
})
if (existing?.payment_status === 'paid') return res.status(200).json({ ok: true })
```

---

*Generated for BobaxShop Development — Claude Code Ready*
