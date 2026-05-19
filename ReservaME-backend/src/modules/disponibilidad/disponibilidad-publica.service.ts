import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { DayOfWeek } from "@prisma/client";

const TZ = "America/Santiago"; // Chile

function parseDateOnlyOrThrow(dateStr: string) {
  // Espera YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new BadRequestException("date debe venir en formato YYYY-MM-DD");
  }
  const [y, m, d] = dateStr.split("-").map((x) => Number(x));
  const date = new Date(y, m - 1, d); // local date (evita parse UTC)
  date.setHours(0, 0, 0, 0);
  return date;
}

function ymdInTZ(now: Date) {
  // retorna YYYY-MM-DD en TZ (sirve para comparar con dateStr)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

function minutesNowInTZ(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hh * 60 + mm;
}

function roundUpToInterval(mins: number, step: number) {
  return Math.ceil(mins / step) * step;
}

function dayOfWeekFromDate(date: Date): DayOfWeek {
  // date.getDay(): 0=SUN ... 6=SAT
  const map: DayOfWeek[] = [
    DayOfWeek.SUN,
    DayOfWeek.MON,
    DayOfWeek.TUE,
    DayOfWeek.WED,
    DayOfWeek.THU,
    DayOfWeek.FRI,
    DayOfWeek.SAT,
  ];
  return map[date.getDay()];
}

function hhmmFromDateInTZ(d: Date) {
  // Retorna HH:mm en TZ para comparar con slots
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hh}:${mm}`;
}

@Injectable()
export class DisponibilidadPublicaService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerDisponibilidad(slug: string, dateStr: string) {
    // 1) Validación y control de fechas pasadas (en TZ Chile)
    parseDateOnlyOrThrow(dateStr);

    const now = new Date();
    const todayStr = ymdInTZ(now);

    // si dateStr es menor a hoy (lexicográfico funciona con YYYY-MM-DD)
    if (dateStr < todayStr) {
      return { date: dateStr, closed: true, reason: "PAST_DATE", slots: [], taken: [] };
    }

    // 2) Buscar barbero
    const barber = await this.prisma.barber.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!barber) throw new NotFoundException("Barbero no encontrado");

    // 3) Buscar horario del día
    const dateLocal = parseDateOnlyOrThrow(dateStr);
    const day = dayOfWeekFromDate(dateLocal);

    const schedule = await this.prisma.barberWeeklySchedule.findUnique({
      where: { barberId_day: { barberId: barber.id, day } },
      select: { isClosed: true, startMin: true, endMin: true },
    });

    if (!schedule || schedule.isClosed) {
      return { date: dateStr, closed: true, reason: "CLOSED", slots: [], taken: [] };
    }

    const dayStart = new Date(dateLocal);
    const dayEnd = new Date(dateLocal.getTime() + 24 * 60 * 60 * 1000);

    const reservas = await this.prisma.reservation.findMany({
      where: {
        barberId: barber.id,
        startAt: { gte: dayStart, lt: dayEnd },
        status: "CONFIRMADA",
      },
      select: { startAt: true },
    });

    const taken = reservas.map((r) => hhmmFromDateInTZ(r.startAt));

    // 5) Slots según rango horario
    const step = 60;

    let startMin = schedule.startMin;
    const endMin = schedule.endMin;

    // 6) Si es HOY, bloquear horas pasadas
    if (dateStr === todayStr) {
      const nowMin = minutesNowInTZ(now);
      const nextSlotMin = roundUpToInterval(nowMin, step);
      startMin = Math.max(startMin, nextSlotMin);
    }

    const slots: string[] = [];
    for (let m = startMin; m <= endMin; m += step) {
      const h = String(Math.floor(m / 60)).padStart(2, "0");
      const min = String(m % 60).padStart(2, "0");
      slots.push(`${h}:${min}`);
    }

    return {
      date: dateStr,
      closed: false,
      startMin,
      endMin,
      slots,
      taken,
    };
  }
}