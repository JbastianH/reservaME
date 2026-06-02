import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DayOfWeek } from "@prisma/client";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class HorarioBarberoService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerHorario(tenantId: string, userId: string) {
    const barber = await this.prisma.barber.findFirst({
      where: { userId, tenantId },
      select: { id: true },
    });

    if (!barber) throw new NotFoundException("Barbero no encontrado");

    return this.prisma.barberWeeklySchedule.findMany({
      where: { tenantId, barberId: barber.id },
      orderBy: { day: "asc" },
    });
  }

  async actualizarHorario(
    tenantId: string,
    userId: string,
    items: {
      day: DayOfWeek;
      isClosed: boolean;
      startMin?: number;
      endMin?: number;
    }[],
  ) {
    const barber = await this.prisma.barber.findFirst({
      where: { userId, tenantId },
      select: { id: true },
    });

    if (!barber) throw new NotFoundException("Barbero no encontrado");

    for (const i of items) {
      if (!i.isClosed) {
        if (typeof i.startMin !== "number" || typeof i.endMin !== "number") {
          throw new BadRequestException("Hora inicio y fin son obligatorios si el día no está cerrado.");
        }
        if (i.startMin < 0 || i.endMin > 24 * 60 || i.startMin >= i.endMin) {
          throw new BadRequestException("Rango horario inválido.");
        }
      }
    }

    const tx = items.map((i) =>
      this.prisma.barberWeeklySchedule.upsert({
        where: { barberId_day: { barberId: barber.id, day: i.day } },
        create: {
          tenantId,
          barberId: barber.id,
          day: i.day,
          isClosed: i.isClosed,
          startMin: i.isClosed ? 600 : (i.startMin ?? 600),
          endMin: i.isClosed ? 1200 : (i.endMin ?? 1200),
        },
        update: {
          isClosed: i.isClosed,
          startMin: i.isClosed ? 600 : i.startMin,
          endMin: i.isClosed ? 1200 : i.endMin,
        },
      }),
    );

    await this.prisma.$transaction(tx);
    return { ok: true };
  }
}