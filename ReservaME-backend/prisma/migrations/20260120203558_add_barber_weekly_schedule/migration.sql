-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateTable
CREATE TABLE "barber_weekly_schedule" (
    "id" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "day" "DayOfWeek" NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "start_min" INTEGER NOT NULL DEFAULT 600,
    "end_min" INTEGER NOT NULL DEFAULT 1200,

    CONSTRAINT "barber_weekly_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "barber_weekly_schedule_barber_id_idx" ON "barber_weekly_schedule"("barber_id");

-- CreateIndex
CREATE UNIQUE INDEX "barber_weekly_schedule_barber_id_day_key" ON "barber_weekly_schedule"("barber_id", "day");

-- AddForeignKey
ALTER TABLE "barber_weekly_schedule" ADD CONSTRAINT "barber_weekly_schedule_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
