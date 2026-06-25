import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { DayOfWeek } from '@prisma/client';

const TZ = 'America/Santiago'; // Chile

function parseDateOnlyOrThrow(dateStr: string) {
  // Espera YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new BadRequestException('date debe venir en formato YYYY-MM-DD');
  }

  const [y, m, d] = dateStr.split('-').map((x) => Number(x));
  const date = new Date(y, m - 1, d); // local date (evita parse UTC)
  date.setHours(0, 0, 0, 0);
  return date;
}

function ymdInTZ(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const m = parts.find((p) => p.type === 'month')?.value ?? '00';
  const d = parts.find((p) => p.type === 'day')?.value ?? '00';

  return `${y}-${m}-${d}`;
}

function minutesNowInTZ(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hh = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const mm = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');

  return hh * 60 + mm;
}

function roundUpToInterval(mins: number, step: number) {
  return Math.ceil(mins / step) * step;
}

function dayOfWeekFromDate(date: Date): DayOfWeek {
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
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const hh = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const mm = parts.find((p) => p.type === 'minute')?.value ?? '00';

  return `${hh}:${mm}`;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

@Injectable()
export class DisponibilidadPublicaService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerDisponibilidad(tenantId: string, slug: string, dateStr: string) {
    // 1) Validación y control de fechas pasadas (en TZ Chile)
    parseDateOnlyOrThrow(dateStr);

    const now = new Date();
    const todayStr = ymdInTZ(now);

    if (dateStr < todayStr) {
      return {
        date: dateStr,
        closed: true,
        reason: 'PAST_DATE',
        slots: [],
        taken: [],
        blocked: [],
      };
    }

    // 2) Buscar barbero
    const barber = await this.prisma.barber.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
      select: {
        id: true,
      },
    });

    if (!barber) {
      throw new NotFoundException('Barbero no encontrado');
    }

    // 3) Buscar horario del día
    const dateLocal = parseDateOnlyOrThrow(dateStr);
    const day = dayOfWeekFromDate(dateLocal);

    const schedule = await this.prisma.barberWeeklySchedule.findUnique({
      where: {
        barberId_day: {
          barberId: barber.id,
          day,
        },
      },
      select: {
        isClosed: true,
        startMin: true,
        endMin: true,
      },
    });

    if (!schedule || schedule.isClosed) {
      return {
        date: dateStr,
        closed: true,
        reason: 'CLOSED',
        slots: [],
        taken: [],
        blocked: [],
      };
    }

    const dayStart = new Date(dateLocal);
    const dayEnd = new Date(dateLocal.getTime() + 24 * 60 * 60 * 1000);

    // 4) Buscar reservas confirmadas del día
    const reservas = await this.prisma.reservation.findMany({
      where: {
        tenantId,
        barberId: barber.id,
        startAt: {
          gte: dayStart,
          lt: dayEnd,
        },
        status: 'CONFIRMADA',
      },
      select: {
        startAt: true,
      },
    });

    // 5) Buscar bloqueos horarios activos del día
    const bloques = await this.prisma.barberTimeBlock.findMany({
      where: {
        tenantId,
        barberId: barber.id,
        isActive: true,
        startAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
      select: {
        startAt: true,
      },
    });

    const takenByReservations = reservas.map((r) =>
      hhmmFromDateInTZ(r.startAt),
    );
    const blocked = bloques.map((b) => hhmmFromDateInTZ(b.startAt));

    // taken incluye reservas + bloqueos para que el frontend los marque como no disponibles
    const taken = uniqueStrings([...takenByReservations, ...blocked]);

    // 6) Slots según rango horario
    const step = 60;

    let startMin = schedule.startMin;
    const endMin = schedule.endMin;

    // 7) Si es HOY, bloquear horas pasadas
    if (dateStr === todayStr) {
      const nowMin = minutesNowInTZ(now);
      const nextSlotMin = roundUpToInterval(nowMin, step);

      startMin = Math.max(startMin, nextSlotMin);
    }

    const slots: string[] = [];

    for (let m = startMin; m <= endMin; m += step) {
      const h = String(Math.floor(m / 60)).padStart(2, '0');
      const min = String(m % 60).padStart(2, '0');

      slots.push(`${h}:${min}`);
    }

    return {
      date: dateStr,
      closed: false,
      startMin,
      endMin,
      slots,
      taken,
      blocked,
    };
  }
}
