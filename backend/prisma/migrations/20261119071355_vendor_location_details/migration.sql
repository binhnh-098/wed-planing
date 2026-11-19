-- AlterTable
ALTER TABLE `vendor` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `province` VARCHAR(191) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL;
