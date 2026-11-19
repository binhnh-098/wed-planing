-- AlterTable
ALTER TABLE `task` ADD COLUMN `assignedSide` ENUM('COMMON', 'BRIDE', 'GROOM') NOT NULL DEFAULT 'COMMON';

-- AlterTable
ALTER TABLE `wedding` ADD COLUMN `brideAddress` VARCHAR(191) NULL,
    ADD COLUMN `brideName` VARCHAR(191) NULL,
    ADD COLUMN `brideProvince` VARCHAR(191) NULL,
    ADD COLUMN `groomAddress` VARCHAR(191) NULL,
    ADD COLUMN `groomName` VARCHAR(191) NULL,
    ADD COLUMN `groomProvince` VARCHAR(191) NULL;
