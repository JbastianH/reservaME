import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ListarReservasQueryDto } from './dto/listar-reservas.query.dto';
import { Prisma } from '@prisma/client';
import { generarTokenSeguro, hashToken } from '../../common/utils/tokens.util';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { AdminDashboardQueryDto } from './dto/admin-dashboard.query.dto';

@Injectable()
export class ReservasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  private parseDateOrThrow(value?: string, campo?: string): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(
        `El parámetro "${campo}" tiene un formato inválido.`,
      );
    }
    return d;
  }

  async listarParaAdmin(tenantId: string, query: ListarReservasQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const from = this.parseDateOrThrow(query.from, 'from');
    const to = this.parseDateOrThrow(query.to, 'to');

    const where: Prisma.ReservationWhereInput = {
      tenantId,
      ...(query.barberId ? { barberId: query.barberId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(from || to
        ? {
            startAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lt: to } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { clientName: { contains: query.q, mode: 'insensitive' } },
              { clientEmail: { contains: query.q, mode: 'insensitive' } },
              { clientPhone: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.reservation.count({ where }),
      this.prisma.reservation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          barberId: true,
          serviceId: true,
          barberServiceId: true,
          clientName: true,
          clientEmail: true,
          clientPhone: true,
          comment: true,
          startAt: true,
          endAt: true,
          status: true,
          canceledAt: true,
          completedAt: true,
          priceFinal: true,
          durationFinalMin: true,
          createdAt: true,
          updatedAt: true,
          barber: { select: { id: true, name: true, slug: true } },
          service: { select: { id: true, name: true } },
        },
      }),
    ]);

    return { page, pageSize, total, items };
  }

  async listarParaBarbero(
    tenantId: string,
    userId: string,
    query: ListarReservasQueryDto,
  ) {
    const barber = await this.prisma.barber.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!barber) {
      throw new NotFoundException(
        'No se encontró el perfil de barbero asociado a tu usuario.',
      );
    }

    return this.listarParaAdmin(tenantId, { ...query, barberId: barber.id });
  }

  async completarComoAdmin(tenantId: string, reservaId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reserva = await tx.reservation.findFirst({
        where: { id: reservaId, tenantId },
        select: { id: true, status: true, clientEmail: true, clientName: true },
      });

      if (!reserva) throw new NotFoundException('Reserva no encontrada.');

      if (reserva.status === 'CANCELADA') {
        throw new BadRequestException(
          'No se puede completar una reserva cancelada.',
        );
      }

      if (reserva.status === 'COMPLETADA') {
        throw new BadRequestException('Esta reserva ya está completada.');
      }

      if (reserva.status !== 'CONFIRMADA') {
        throw new BadRequestException(
          'Solo se pueden completar reservas confirmadas.',
        );
      }

      const updated = await tx.reservation.update({
        where: { id: reservaId },
        data: { status: 'COMPLETADA', completedAt: new Date() },
      });

      const { tokenPlano, expiresAt } = await this.generarTokenDeResena(
        tx,
        tenantId,
        reservaId,
      );

      const frontendUrl = (
        this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
      ).replace(/\/$/, '');

      const link = `${frontendUrl}/resena/${encodeURIComponent(tokenPlano)}`;

      await this.mail.enviarResena({
        to: reserva.clientEmail,
        nombre: reserva.clientName,
        link,
      });

      return {
        ok: true,
        reserva: updated,
        reviewToken: tokenPlano,
        reviewTokenExpiresAt: expiresAt,
      };
    });
  }

  async completarComoBarbero(
    tenantId: string,
    userId: string,
    reservaId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const barber = await tx.barber.findFirst({
        where: { tenantId, userId },
        select: { id: true },
      });

      if (!barber) {
        throw new NotFoundException(
          'No se encontró el perfil de barbero asociado a tu usuario.',
        );
      }

      const reserva = await tx.reservation.findFirst({
        where: { id: reservaId, tenantId },
        select: {
          id: true,
          barberId: true,
          status: true,
          clientEmail: true,
          clientName: true,
        },
      });

      if (!reserva) throw new NotFoundException('Reserva no encontrada.');

      if (reserva.barberId !== barber.id) {
        throw new BadRequestException(
          'No tienes permiso para completar esta reserva.',
        );
      }

      if (reserva.status === 'CANCELADA') {
        throw new BadRequestException(
          'No se puede completar una reserva cancelada.',
        );
      }

      if (reserva.status === 'COMPLETADA') {
        throw new BadRequestException('Esta reserva ya está completada.');
      }

      if (reserva.status !== 'CONFIRMADA') {
        throw new BadRequestException(
          'Solo se pueden completar reservas confirmadas.',
        );
      }

      const updated = await tx.reservation.update({
        where: { id: reservaId },
        data: { status: 'COMPLETADA', completedAt: new Date() },
      });

      const { tokenPlano, expiresAt } = await this.generarTokenDeResena(
        tx,
        tenantId,
        reservaId,
      );

      const frontendUrl = (
        this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
      ).replace(/\/$/, '');

      const link = `${frontendUrl}/resena/${encodeURIComponent(tokenPlano)}`;

      await this.mail.enviarResena({
        to: reserva.clientEmail,
        nombre: reserva.clientName,
        link,
      });

      return {
        ok: true,
        reserva: updated,
        reviewToken: tokenPlano,
        reviewTokenExpiresAt: expiresAt,
      };
    });
  }

  private async generarTokenDeResena(
    tx: Prisma.TransactionClient,
    tenantId: string,
    reservationId: string,
  ) {
    const ttlMin = Number(this.config.get('REVIEW_TOKEN_TTL_MINUTES') ?? 43200);
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    const tokenPlano = generarTokenSeguro(32);
    const tokenHash = hashToken(tokenPlano);

    await tx.token.updateMany({
      where: {
        tenantId,
        reservationId,
        type: 'RESENA',
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    await tx.token.create({
      data: {
        tenantId,
        type: 'RESENA',
        tokenHash,
        reservationId,
        expiresAt,
      },
    });

    return { tokenPlano, expiresAt };
  }

  private async generarTokenGestionReserva(
    tx: Prisma.TransactionClient,
    tenantId: string,
    reservationId: string,
  ) {
    const ttlMin = Number(
      this.config.get('RESERVATION_MANAGEMENT_TOKEN_TTL_MINUTES') ?? 1440,
    );
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    const tokenPlano = generarTokenSeguro(32);
    const tokenHash = hashToken(tokenPlano);

    await tx.token.updateMany({
      where: {
        tenantId,
        reservationId,
        type: 'GESTION_RESERVA',
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    await tx.token.create({
      data: {
        tenantId,
        type: 'GESTION_RESERVA',
        tokenHash,
        reservationId,
        expiresAt,
      },
    });

    return { tokenPlano, expiresAt };
  }

  async cancelarComoAdmin(tenantId: string, reservaId: string) {
    const reserva = await this.prisma.reservation.findFirst({
      where: { id: reservaId, tenantId },
      select: { id: true, status: true },
    });

    if (!reserva) throw new NotFoundException('Reserva no encontrada.');

    if (reserva.status === 'COMPLETADA') {
      throw new BadRequestException(
        'No se puede cancelar una reserva completada.',
      );
    }

    if (reserva.status === 'CANCELADA') {
      throw new BadRequestException('Esta reserva ya está cancelada.');
    }

    const updated = await this.prisma.reservation.update({
      where: { id: reservaId },
      data: { status: 'CANCELADA', canceledAt: new Date() },
    });

    return { ok: true, reserva: updated };
  }

  async cancelarComoBarbero(
    tenantId: string,
    userId: string,
    reservaId: string,
  ) {
    const barber = await this.prisma.barber.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!barber) {
      throw new NotFoundException(
        'No se encontró el perfil de barbero asociado a tu usuario.',
      );
    }

    const reserva = await this.prisma.reservation.findFirst({
      where: { id: reservaId, tenantId },
      select: { id: true, barberId: true, status: true },
    });

    if (!reserva) throw new NotFoundException('Reserva no encontrada.');

    if (reserva.barberId !== barber.id) {
      throw new BadRequestException(
        'No tienes permiso para cancelar esta reserva.',
      );
    }

    if (reserva.status === 'COMPLETADA') {
      throw new BadRequestException(
        'No se puede cancelar una reserva completada.',
      );
    }

    if (reserva.status === 'CANCELADA') {
      throw new BadRequestException('Esta reserva ya está cancelada.');
    }

    const updated = await this.prisma.reservation.update({
      where: { id: reservaId },
      data: { status: 'CANCELADA', canceledAt: new Date() },
    });

    return { ok: true, reserva: updated };
  }

  private async validarNoSolapamiento(
    tenantId: string,
    barberId: string,
    startAt: Date,
    endAt: Date,
    excludeReservationId: string,
  ) {
    const conflicto = await this.prisma.reservation.findFirst({
      where: {
        tenantId,
        barberId,
        id: { not: excludeReservationId },
        status: 'CONFIRMADA',
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });

    if (conflicto) {
      throw new BadRequestException(
        'Existe un solapamiento con otra reserva en ese horario.',
      );
    }
  }

  async reprogramarComoAdmin(
    tenantId: string,
    reservaId: string,
    startAtIso: string,
  ) {
    const frontendUrl = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');

    const result = await this.prisma.$transaction(async (tx) => {
      const reserva = await tx.reservation.findFirst({
        where: { id: reservaId, tenantId },
        select: {
          id: true,
          status: true,
          barberId: true,
          durationFinalMin: true,
          clientEmail: true,
          clientName: true,
          startAt: true,
          endAt: true,
          priceFinal: true,
          comment: true,
          barber: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
        },
      });

      if (!reserva) throw new NotFoundException('Reserva no encontrada.');

      if (reserva.status === 'CANCELADA') {
        throw new BadRequestException(
          'No se puede reprogramar una reserva cancelada.',
        );
      }

      if (reserva.status === 'COMPLETADA') {
        throw new BadRequestException(
          'No se puede reprogramar una reserva completada.',
        );
      }

      if (reserva.status !== 'CONFIRMADA') {
        throw new BadRequestException(
          'Solo se pueden reprogramar reservas confirmadas.',
        );
      }

      const startAt = new Date(startAtIso);

      if (Number.isNaN(startAt.getTime())) {
        throw new BadRequestException(
          'El parámetro "startAt" tiene un formato inválido.',
        );
      }

      const durationMin = reserva.durationFinalMin;

      if (!durationMin || durationMin <= 0) {
        throw new BadRequestException(
          'La reserva no tiene duración válida para reprogramar.',
        );
      }

      const endAt = new Date(startAt.getTime() + durationMin * 60 * 1000);

      await this.validarNoSolapamiento(
        tenantId,
        reserva.barberId,
        startAt,
        endAt,
        reserva.id,
      );

      const updated = await tx.reservation.update({
        where: { id: reserva.id },
        data: { startAt, endAt, reminderSentAt: null },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          durationFinalMin: true,
          priceFinal: true,
          clientEmail: true,
          clientName: true,
          comment: true,
          barber: { select: { name: true } },
          service: { select: { name: true } },
        },
      });

      const { tokenPlano } = await this.generarTokenGestionReserva(
        tx,
        tenantId,
        reserva.id,
      );

      const linkGestion = `${frontendUrl}/reserva/gestionar/${encodeURIComponent(
        tokenPlano,
      )}`;

      return { updated, linkGestion };
    });

    await this.mail.enviarReservaReprogramadaConGestion({
      to: result.updated.clientEmail,
      nombre: result.updated.clientName,
      resumen: {
        barberName: result.updated.barber?.name ?? '—',
        serviceName: result.updated.service?.name ?? '—',
        startAt: result.updated.startAt,
        endAt: result.updated.endAt,
        priceFinal: result.updated.priceFinal.toString(),
        durationFinalMin: result.updated.durationFinalMin,
        comment: result.updated.comment ?? null,
      },
      linkGestion: result.linkGestion,
    });

    return { ok: true, reserva: result.updated };
  }

  async reprogramarComoBarbero(
    tenantId: string,
    userId: string,
    reservaId: string,
    startAtIso: string,
  ) {
    const frontendUrl = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');

    const result = await this.prisma.$transaction(async (tx) => {
      const barber = await tx.barber.findFirst({
        where: { tenantId, userId },
        select: { id: true },
      });

      if (!barber) {
        throw new NotFoundException(
          'No se encontró el perfil de barbero asociado a tu usuario.',
        );
      }

      const reserva = await tx.reservation.findFirst({
        where: { id: reservaId, tenantId },
        select: {
          id: true,
          barberId: true,
          status: true,
          durationFinalMin: true,
          clientEmail: true,
          clientName: true,
          startAt: true,
          endAt: true,
          priceFinal: true,
          comment: true,
          barber: { select: { name: true } },
          service: { select: { name: true } },
        },
      });

      if (!reserva) throw new NotFoundException('Reserva no encontrada.');

      if (reserva.barberId !== barber.id) {
        throw new BadRequestException(
          'No tienes permiso para reprogramar esta reserva.',
        );
      }

      if (reserva.status === 'CANCELADA') {
        throw new BadRequestException(
          'No se puede reprogramar una reserva cancelada.',
        );
      }

      if (reserva.status === 'COMPLETADA') {
        throw new BadRequestException(
          'No se puede reprogramar una reserva completada.',
        );
      }

      if (reserva.status !== 'CONFIRMADA') {
        throw new BadRequestException(
          'Solo se pueden reprogramar reservas confirmadas.',
        );
      }

      const startAt = new Date(startAtIso);

      if (Number.isNaN(startAt.getTime())) {
        throw new BadRequestException(
          'El parámetro "startAt" tiene un formato inválido.',
        );
      }

      const durationMin = reserva.durationFinalMin;

      if (!durationMin || durationMin <= 0) {
        throw new BadRequestException(
          'La reserva no tiene duración válida para reprogramar.',
        );
      }

      const endAt = new Date(startAt.getTime() + durationMin * 60 * 1000);

      await this.validarNoSolapamiento(
        tenantId,
        reserva.barberId,
        startAt,
        endAt,
        reserva.id,
      );

      const updated = await tx.reservation.update({
        where: { id: reserva.id },
        data: { startAt, endAt, reminderSentAt: null },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          durationFinalMin: true,
          priceFinal: true,
          clientEmail: true,
          clientName: true,
          comment: true,
          barber: { select: { name: true } },
          service: { select: { name: true } },
        },
      });

      const { tokenPlano } = await this.generarTokenGestionReserva(
        tx,
        tenantId,
        reserva.id,
      );

      const linkGestion = `${frontendUrl}/reserva/gestionar/${encodeURIComponent(
        tokenPlano,
      )}`;

      return { updated, linkGestion };
    });

    await this.mail.enviarReservaReprogramadaConGestion({
      to: result.updated.clientEmail,
      nombre: result.updated.clientName,
      resumen: {
        barberName: result.updated.barber?.name ?? '—',
        serviceName: result.updated.service?.name ?? '—',
        startAt: result.updated.startAt,
        endAt: result.updated.endAt,
        priceFinal: result.updated.priceFinal.toString(),
        durationFinalMin: result.updated.durationFinalMin,
        comment: result.updated.comment ?? null,
      },
      linkGestion: result.linkGestion,
    });

    return { ok: true, reserva: result.updated };
  }

  private rangeToDates(query: AdminDashboardQueryDto) {
    const now = new Date();

    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const range = query.range ?? 'HOY';

    if (range === 'TOTAL') return {};
    if (range === 'HOY') return { from: startOfDay, to: endOfDay };

    if (range === 'MES') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { from, to };
    }

    if (!query.from || !query.to) {
      throw new BadRequestException(
        'Para range=CUSTOM debes enviar from y to.',
      );
    }

    const from = new Date(query.from);
    const to = new Date(query.to);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('from/to inválidos.');
    }

    return { from, to };
  }

  async kpisAdmin(tenantId: string, query: AdminDashboardQueryDto) {
    const { from, to } = this.rangeToDates(query);

    const whereRango: Prisma.ReservationWhereInput = {
      tenantId,
      ...(from && to ? { startAt: { gte: from, lt: to } } : {}),
    };

    const [total, confirmadas, completadas, canceladas, ingresosAgg] =
      await this.prisma.$transaction([
        this.prisma.reservation.count({ where: whereRango }),
        this.prisma.reservation.count({
          where: { ...whereRango, status: 'CONFIRMADA' },
        }),
        this.prisma.reservation.count({
          where: { ...whereRango, status: 'COMPLETADA' },
        }),
        this.prisma.reservation.count({
          where: { ...whereRango, status: 'CANCELADA' },
        }),
        this.prisma.reservation.aggregate({
          where: { ...whereRango, status: 'COMPLETADA' },
          _sum: { priceFinal: true },
        }),
      ]);

    const ingreso = ingresosAgg._sum.priceFinal ?? new Prisma.Decimal(0);

    return {
      ok: true,
      range: query.range ?? 'HOY',
      from,
      to,
      kpis: {
        total,
        confirmadas,
        completadas,
        canceladas,
        ingresoCompletadas: ingreso.toString(),
      },
    };
  }
}