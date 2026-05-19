/*
  Warnings:

  - You are about to drop the `AppSetting` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "AppSetting";

-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "reminder_hours_before" INTEGER NOT NULL DEFAULT 24,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);
