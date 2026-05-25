ALTER TABLE `orders` MODIFY COLUMN `method` ENUM('gamepass', 'community', 'transfer') NOT NULL;
ALTER TABLE `guilds` ADD COLUMN `robux_rate_transfer` DECIMAL(10,2);
ALTER TABLE `guilds` ADD COLUMN `enable_community` BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE `guilds` ADD COLUMN `enable_gamepass` BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE `guilds` ADD COLUMN `enable_transfer` BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE `guilds` ADD COLUMN `roblox_user_id` VARCHAR(32) DEFAULT '456687425';
