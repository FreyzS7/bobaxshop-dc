ALTER TABLE `guilds` ADD COLUMN `payment_mode` enum('manual','midtrans') NOT NULL DEFAULT 'manual';
