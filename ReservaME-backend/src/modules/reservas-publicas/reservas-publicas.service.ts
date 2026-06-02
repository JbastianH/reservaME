import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, ReservationStatus } from '@prisma/client';

import { PrismaService } from '../../config/prisma.service';
import { MailService } from '../mail/mail.service';
import { CrearReservaPublicaDto } from './dto/crear-reserva-publica.dto';
import { generarTokenSeguro, hashToken } from '../../common/utils/tokens.util';

@Injectable()
export class ReservasPublicasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async crear(tenantId: string, dto: CrearReservaPublicaDto) {
    const startAt = this.parseIsoOrThrow(dto.startAt, 'startAt');

    const clientName = dto.clientName.trim();
    const clientEmail = dto.clientEmail.trim().toLowerCase();
    const clientPhone = dto.clientPhone.trim();
    const comment = dto.comment?.trim() ?? null;

    const ttlMin = Number(
      this.config.get('RESERVATION_MANAGEMENT_TOKEN_TTL_MINUTES') ?? 1440,
    );
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    const frontendUrl = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');

    const result = await this.prisma.$transaction(async (tx) => {
      const barber = await tx.barber.findFirst({
        where: {
          id: dto.barberId,
          tenantId,
        },
        select: { id: true, name: true, isActive: true },
      });

      if (!barber) throw new NotFoundException('Barbero no encontrado.');
      if (!barber.isActive) {
        throw new BadRequestException(
          'Este barbero no se encuentra disponible.',
        );
      }

      const barberService = await tx.barberService.findFirst({
        where: {
          id: dto.barberServiceId,
          tenantId,
        },
        select: {
          id: true,
          barberId: true,
          isActive: true,
          price: true,
          durationMin: true,
          service: { select: { id: true, name: true, isActive: true } },
        },
      });

      if (!barberService) {
        throw new NotFoundException('Servicio del barbero no encontrado.');
      }

      if (barberService.barberId !== barber.id) {
        throw new BadRequestException(
          'El servicio seleccionado no pertenece a este barbero.',
        );
      }

      if (!barberService.isActive || !barberService.service.isActive) {
        throw new BadRequestException(
          'Este servicio ya no se encuentra disponible. Por favor, elige otro.',
        );
      }

      const durationFinalMin = barberService.durationMin;
      const endAt = new Date(startAt.getTime() + durationFinalMin * 60 * 1000);

      const solapada = await tx.reservation.findFirst({
        where: {
          tenantId,
          barberId: barber.id,
          status: ReservationStatus.CONFIRMADA,
          AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
        },
        select: { id: true },
      });

      if (solapada) {
        throw new BadRequestException(
          'El horario seleccionado ya está ocupado. Por favor, elige otro horario.',
        );
      }

      const reserva = await tx.reservation.create({
        data: {
          tenantId,
          barberId: barber.id,
          serviceId: barberService.service.id,
          barberServiceId: barberService.id,
          clientName,
          clientEmail,
          clientPhone,
          comment,
          startAt,
          endAt,
          status: ReservationStatus.CONFIRMADA,
          priceFinal: new Prisma.Decimal(barberService.price),
          durationFinalMin,
        },
        select: {
          id: true,
          tenantId: true,
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
          priceFinal: true,
          durationFinalMin: true,
        },
      });

      const tokenPlano = generarTokenSeguro(32);
      const tokenHash = hashToken(tokenPlano);

      await tx.token.updateMany({
        where: {
          tenantId,
          reservationId: reserva.id,
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
          reservationId: reserva.id,
          expiresAt,
        },
      });

      const linkGestion = `${frontendUrl}/reserva/gestionar/${tokenPlano}`;

      return {
        reserva,
        barberName: barber.name,
        serviceName: barberService.service.name,
        linkGestion,
      };
    });

    await this.mail.enviarResumenReservaConGestion({
      to: result.reserva.clientEmail,
      nombre: result.reserva.clientName,
      resumen: {
        barberName: result.barberName,
        serviceName: result.serviceName,
        startAt: result.reserva.startAt,
        endAt: result.reserva.endAt,
        priceFinal: result.reserva.priceFinal.toString(),
        durationFinalMin: result.reserva.durationFinalMin,
        comment: result.reserva.comment ?? null,
      },
      linkGestion: result.linkGestion,
    });

    return { ok: true, reserva: result.reserva };
  }

  async obtenerResumenPublico(tenantId: string, id: string) {
    const r = await this.prisma.reservation.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        status: true,
        startAt: true,
        endAt: true,
        priceFinal: true,
        durationFinalMin: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        comment: true,
        barber: { select: { id: true, name: true, slug: true } },
        service: { select: { id: true, name: true } },
      },
    });

    if (!r) throw new NotFoundException('Reserva no encontrada.');

    return {
      id: r.id,
      status: r.status,
      startAt: r.startAt,
      endAt: r.endAt,
      priceFinal: r.priceFinal.toString(),
      durationFinalMin: r.durationFinalMin,
      clientName: r.clientName,
      clientEmail: r.clientEmail,
      clientPhone: r.clientPhone,
      comment: r.comment,
      barber: r.barber,
      service: r.service,
    };
  }

  async cancelarConToken(dto: { token: string }) {
    const tokenHash = hashToken(dto.token);

    return this.prisma.$transaction(async (tx) => {
      const token = await tx.token.findUnique({
        where: { tokenHash },
        include: {
          reservation: true,
        },
      });

      if (!token) throw new NotFoundException('Token inválido.');

      if (token.type !== 'GESTION_RESERVA') {
        throw new BadRequestException(
          'Token no válido para gestión de reserva.',
        );
      }

      if (token.usedAt) {
        throw new BadRequestException('Este enlace ya fue utilizado.');
      }

      if (token.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException('Este enlace ha expirado.');
      }

      if (!token.reservation) {
        throw new BadRequestException('Reserva asociada no encontrada.');
      }

      if (token.reservation.status === 'CANCELADA') {
        throw new BadRequestException('La reserva ya está cancelada.');
      }

      if (token.reservation.status === 'COMPLETADA') {
        throw new BadRequestException(
          'No se puede cancelar una reserva completada.',
        );
      }

      const reservaCancelada = await tx.reservation.update({
        where: { id: token.reservation.id },
        data: {
          status: 'CANCELADA',
          canceledAt: new Date(),
        },
      });

      await tx.token.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });

      return {
        ok: true,
        mensaje: 'Reserva cancelada correctamente.',
        reserva: reservaCancelada,
      };
    });
  }

  async reprogramarConToken(dto: { token: string; startAt: string }) {
    const tokenHash = hashToken(dto.token);
    const nuevoInicio = new Date(dto.startAt);

    if (Number.isNaN(nuevoInicio.getTime())) {
      throw new BadRequestException('Fecha de inicio inválida.');
    }

    const ttlMin = Number(
      this.config.get('RESERVATION_MANAGEMENT_TOKEN_TTL_MINUTES') ?? 1440,
    );
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    const frontendUrl = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');

    const result = await this.prisma.$transaction(async (tx) => {
      const token = await tx.token.findUnique({
        where: { tokenHash },
        include: {
          reservation: {
            include: {
              barber: { select: { id: true, name: true, slug: true } },
              service: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!token) throw new NotFoundException('Token inválido.');

      if (token.type !== 'GESTION_RESERVA') {
        throw new BadRequestException(
          'Token no válido para gestión de reserva.',
        );
      }

      if (token.usedAt) {
        throw new BadRequestException('Este enlace ya fue utilizado.');
      }

      if (token.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException('Este enlace ha expirado.');
      }

      if (!token.reservation) {
        throw new BadRequestException('Reserva asociada no encontrada.');
      }

      const reserva = token.reservation;

      if (reserva.status !== 'CONFIRMADA') {
        throw new BadRequestException(
          'Solo se pueden reprogramar reservas confirmadas.',
        );
      }

      const nuevaFin = new Date(
        nuevoInicio.getTime() + reserva.durationFinalMin * 60 * 1000,
      );

      const conflicto = await tx.reservation.findFirst({
        where: {
          tenantId: reserva.tenantId,
          barberId: reserva.barberId,
          id: { not: reserva.id },
          status: { in: ['CONFIRMADA'] },
          AND: [{ startAt: { lt: nuevaFin } }, { endAt: { gt: nuevoInicio } }],
        },
        select: { id: true },
      });

      if (conflicto) {
        throw new BadRequestException(
          'El horario seleccionado ya no está disponible.',
        );
      }

      const reservaActualizada = await tx.reservation.update({
        where: { id: reserva.id },
        data: {
          startAt: nuevoInicio,
          endAt: nuevaFin,
        },
        select: {
          id: true,
          tenantId: true,
          clientName: true,
          clientEmail: true,
          clientPhone: true,
          comment: true,
          startAt: true,
          endAt: true,
          status: true,
          durationFinalMin: true,
          priceFinal: true,
          barber: { select: { id: true, name: true, slug: true } },
          service: { select: { id: true, name: true } },
        },
      });

      await tx.token.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });

      const tokenPlanoNuevo = generarTokenSeguro(32);
      const tokenHashNuevo = hashToken(tokenPlanoNuevo);

      await tx.token.updateMany({
        where: {
          tenantId: reservaActualizada.tenantId,
          reservationId: reservaActualizada.id,
          type: 'GESTION_RESERVA',
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      await tx.token.create({
        data: {
          tenantId: reservaActualizada.tenantId,
          type: 'GESTION_RESERVA',
          tokenHash: tokenHashNuevo,
          reservationId: reservaActualizada.id,
          expiresAt,
        },
      });

      const linkGestionNuevo = `${frontendUrl}/reserva/gestionar/${tokenPlanoNuevo}`;

      return {
        reserva: reservaActualizada,
        linkGestion: linkGestionNuevo,
      };
    });

    await this.mail.enviarReservaReprogramadaConGestion({
      to: result.reserva.clientEmail,
      nombre: result.reserva.clientName,
      resumen: {
        barberName: result.reserva.barber.name,
        serviceName: result.reserva.service.name,
        startAt: result.reserva.startAt,
        endAt: result.reserva.endAt,
        priceFinal: result.reserva.priceFinal.toString(),
        durationFinalMin: result.reserva.durationFinalMin,
        comment: result.reserva.comment ?? null,
      },
      linkGestion: result.linkGestion,
    });

    return {
      ok: true,
      mensaje: 'Reserva reprogramada correctamente.',
      reserva: result.reserva,
    };
  }

  async obtenerGestionPorToken(dto: { token: string }) {
    const tokenHash = hashToken(dto.token);

    const token = await this.prisma.token.findUnique({
      where: { tokenHash },
      include: {
        reservation: {
          include: {
            barber: { select: { id: true, name: true, slug: true } },
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!token) throw new NotFoundException('Token inválido.');

    if (token.type !== 'GESTION_RESERVA') {
      throw new BadRequestException('Token no válido para gestión de reserva.');
    }

    if (token.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Este enlace ha expirado.');
    }

    if (!token.reservation) {
      throw new BadRequestException('Reserva asociada no encontrada.');
    }

    const r = token.reservation;

    return {
      ok: true,
      token: {
        usedAt: token.usedAt,
        expiresAt: token.expiresAt,
      },
      reserva: {
        id: r.id,
        status: r.status,
        startAt: r.startAt,
        endAt: r.endAt,
        priceFinal: r.priceFinal.toString(),
        durationFinalMin: r.durationFinalMin,
        clientName: r.clientName,
        clientEmail: r.clientEmail,
        clientPhone: r.clientPhone,
        comment: r.comment,
        barber: r.barber,
        service: r.service,
      },
    };
  }

  private parseIsoOrThrow(value: string, campo: string): Date {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(
        `El campo "${campo}" tiene un formato inválido.`,
      );
    }
    return d;
  }
}