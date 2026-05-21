# Deploy Guide — BobaxShop di Ubuntu 22.04

## Prasyarat

- Ubuntu 22.04 LTS
- Akses root atau sudo
- Domain/IP publik (untuk webhook Midtrans jika pakai mode midtrans)

---

## 1. Install Dependencies

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 (process manager)
npm install -g pm2

# Install MySQL
sudo apt install -y mysql-server

# Install git
sudo apt install -y git
```

---

## 2. Setup MySQL

```bash
# Masuk ke MySQL
sudo mysql

# Buat database dan user
CREATE DATABASE bobaxshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bobax'@'localhost' IDENTIFIED BY 'PASSWORD_KAMU';
GRANT ALL PRIVILEGES ON bobaxshop.* TO 'bobax'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> Ganti `PASSWORD_KAMU` dengan password yang kuat.

---

## 3. Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/FreyzS7/bobaxshop-dc.git BotBobax
cd BotBobax
```

---

## 4. Setup Environment

```bash
cp .env.example .env
nano .env
```

Isi semua value:

```env
DATABASE_URL=mysql://bobax:PASSWORD_KAMU@localhost:3306/bobaxshop

DISCORD_TOKEN=           # Token bot Discord
DISCORD_CLIENT_ID=       # Application ID di Discord Developer Portal
NEXT_PUBLIC_DISCORD_CLIENT_ID=  # Sama dengan DISCORD_CLIENT_ID

MIDTRANS_SERVER_KEY=     # Dari dashboard Midtrans (opsional)
MIDTRANS_CLIENT_KEY=     # Dari dashboard Midtrans (opsional)
MIDTRANS_IS_PRODUCTION=false

WEBHOOK_PORT=3001
BOT_WEBHOOK_SECRET=      # String random, contoh: abc123xyz

BOT_API_URL=http://localhost:3001
BOT_API_SECRET=          # String random, contoh: bobax-secret-2026

NEXTAUTH_SECRET=         # Generate: openssl rand -base64 32
NEXTAUTH_URL=https://DOMAIN_KAMU  # atau http://IP:3000 jika tidak pakai domain

NODE_ENV=production
```

> Generate NEXTAUTH_SECRET: `openssl rand -base64 32`

---

## 5. Install Dependencies

```bash
pnpm install
```

---

## 6. Jalankan Migrasi Database

```bash
mysql -u bobax -p bobaxshop < packages/database/schema.sql
```

> Masukkan password MySQL saat diminta. File `schema.sql` sudah berisi semua tabel dan kolom terbaru dalam satu file.

---

## 7. Build Web

```bash
cd apps/web
pnpm build
cd ../..
```

---

## 8. Update ecosystem.config.js

Edit path sesuai lokasi instalasi:

```bash
nano ecosystem.config.js
```

Ganti semua `/home/ubuntu/BotBobax` dengan path aktual kamu (cek dengan `pwd`).

---

## 9. Buat Folder Logs

```bash
mkdir -p /home/ubuntu/logs
```

---

## 10. Jalankan dengan PM2

```bash
chmod +x start.sh
./start.sh
```

Cek status:
```bash
./start.sh status
# atau
pm2 status
```

---

## 11. Auto-start saat Server Reboot

```bash
pm2 startup
# Ikuti perintah yang muncul (biasanya sudo env PATH=...)
pm2 save
```

---

## Perintah Harian

| Perintah | Fungsi |
|----------|--------|
| `./start.sh` | Start semua service |
| `./start.sh stop` | Stop semua service |
| `./start.sh status` | Cek status |
| `./start.sh logs` | Lihat logs realtime |
| `pm2 logs bobaxshop-bot` | Log bot saja |
| `pm2 logs bobaxshop-web` | Log web saja |
| `pm2 restart all` | Restart semua |

---

## Update dari GitHub

Setiap kali ada perubahan dari Windows:

**Di Windows:**
```bash
git add .
git commit -m "update"
git push
```

**Di Ubuntu:**
```bash
cd /home/ubuntu/BotBobax
git pull
pnpm install        # jika ada perubahan package
cd apps/web && pnpm build && cd ../..  # jika ada perubahan web
pm2 restart all
```

---

## Setup Nginx (Opsional — jika pakai domain)

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/bobaxshop
```

Isi:
```nginx
server {
    listen 80;
    server_name DOMAIN_KAMU;

    # Web dashboard
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Bot webhook (Midtrans)
    location /midtrans {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bobaxshop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**HTTPS dengan Certbot:**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d DOMAIN_KAMU
```

---

## Troubleshooting

**Bot tidak jalan:**
```bash
pm2 logs bobaxshop-bot --lines 50
```

**Web tidak bisa diakses:**
```bash
pm2 logs bobaxshop-web --lines 50
```

**Database error:**
```bash
mysql -u bobax -p bobaxshop
SHOW TABLES;
```

**Port sudah dipakai:**
```bash
sudo lsof -i :3000
sudo lsof -i :3001
```
