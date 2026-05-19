-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "reminder_sent_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "reminderHoursBefore" INTEGER NOT NULL DEFAULT 24,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);
