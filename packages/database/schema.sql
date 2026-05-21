-- BobaxShop — MySQL Schema
-- Jalankan: mysql -u bobax -p bobaxshop < packages/database/schema.sql

CREATE TABLE IF NOT EXISTS `guilds` (
  `id` varchar(32) PRIMARY KEY NOT NULL,
  `name` varchar(255) NOT NULL,
  `setup_done` boolean NOT NULL DEFAULT false,
  `admin_role_id` varchar(32),
  `robux_rate` decimal(10,2),
  `robux_rate_gamepass` decimal(10,2),
  `tax_percent` decimal(5,2) NOT NULL DEFAULT '30',
  `min_robux` int NOT NULL DEFAULT 1000,
  `step_robux` int NOT NULL DEFAULT 500,
  `payment_mode` enum('manual','midtrans') NOT NULL DEFAULT 'manual',
  `is_open` boolean NOT NULL DEFAULT true,
  `status_message` varchar(500),
  `category_id` varchar(32),
  `ch_commands` varchar(32),
  `ch_logs` varchar(32),
  `ch_announce` varchar(32),
  `ch_order` varchar(32),
  `ch_buy` varchar(32),
  `pending_cat_id` varchar(32),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `admins` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `guild_id` varchar(32) NOT NULL,
  `discord_user_id` varchar(32) NOT NULL,
  `added_by` varchar(32) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `admins_guild_discord_unique` (`guild_id`, `discord_user_id`),
  CONSTRAINT `admins_guild_id_fk` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`)
);

CREATE TABLE IF NOT EXISTS `orders` (
  `id` varchar(36) PRIMARY KEY NOT NULL,
  `guild_id` varchar(32) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `buyer_id` varchar(32) NOT NULL,
  `buyer_username` varchar(100) NOT NULL,
  `method` enum('gamepass','community') NOT NULL,
  `robux_amount` int NOT NULL,
  `robux_gross` int NOT NULL,
  `gamepass_link` varchar(500),
  `roblox_username` varchar(100),
  `price_idr` int NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `payment_status` enum('pending','paid','expired','failed') NOT NULL DEFAULT 'pending',
  `order_status` enum('waiting_payment','paid','processing','completed','cancelled','refunded') NOT NULL DEFAULT 'waiting_payment',
  `midtrans_order_id` varchar(100),
  `midtrans_snap_token` varchar(500),
  `pending_channel_id` varchar(32),
  `order_channel_msg_id` varchar(32),
  `processed_by` varchar(32),
  `proof_image_url` varchar(1000),
  `notes` varchar(1000),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `orders_order_number_unique` (`order_number`),
  UNIQUE KEY `orders_midtrans_order_id_unique` (`midtrans_order_id`),
  CONSTRAINT `orders_guild_id_fk` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`)
);

CREATE TABLE IF NOT EXISTS `order_logs` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `action` varchar(50) NOT NULL,
  `actor` varchar(32),
  `note` varchar(1000),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `order_logs_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
);

CREATE TABLE IF NOT EXISTS `web_users` (
  `id` varchar(36) PRIMARY KEY NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('superadmin','viewer') NOT NULL DEFAULT 'viewer',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `web_users_email_unique` (`email`)
);
