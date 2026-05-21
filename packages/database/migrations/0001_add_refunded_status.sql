ALTER TABLE `orders` MODIFY COLUMN `order_status` enum('waiting_payment','paid','processing','completed','cancelled','refunded') NOT NULL DEFAULT 'waiting_payment';
