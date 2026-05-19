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

  async crear(dto: CrearReservaPublicaDto) {
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
      // Se valida que el barbero exista y esté activo.
      const barber = await tx.barber.findUnique({
        where: { id: dto.barberId },
        select: { id: true, name: true, isActive: true },
      });

      if (!barber) throw new NotFoundException('Barbero no encontrado.');
      if (!barber.isActive)
        throw new BadRequestException(
          'Este barbero no se encuentra disponible.',
        );

      // Se valida que el BarberService exista y pertenezca al barbero.
      const barberService = await tx.barberService.findUnique({
        where: { id: dto.barberServiceId },
        select: {
          id: true,
          barberId: true,
          isActive: true,
          price: true,
          durationMin: true,
          service: { select: { id: true, name: true, isActive: true } },
        },
      });

      if (!barberService)
        throw new NotFoundException('Servicio del barbero no encontrado.');
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

      // Se calcula endAt según duración.
      const durationFinalMin = barberService.durationMin;
      const endAt = new Date(startAt.getTime() + durationFinalMin * 60 * 1000);

      // Se verifica solapamiento en el rango [startAt, endAt).
      const solapada = await tx.reservation.findFirst({
        where: {
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

      // Se crea la reserva confirmada.
      const reserva = await tx.reservation.create({
        data: {
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

      // Se genera token de gestión y se persiste hasheado.
      const tokenPlano = generarTokenSeguro(32);
      const tokenHash = hashToken(tokenPlano);

      await tx.token.updateMany({
        where: {
          reservationId: reserva.id,
          type: 'GESTION_RESERVA',
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      await tx.token.create({
        data: {
          type: 'GESTION_RESERVA',
          tokenHash,
          reservationId: reserva.id,
          expiresAt,
        },
      });

      // Se construye el link de gestión.
      const linkGestion = `${frontendUrl}/reserva/gestionar/${tokenPlano}`;

      return {
        reserva,
        barberName: barber.name,
        serviceName: barberService.service.name,
        linkGestion,
      };
    });

    // Se envía correo fuera de la transacción.
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

  private parseIsoOrThrow(value: string, campo: string): Date {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(
        `El campo "${campo}" tiene un formato inválido.`,
      );
    }
    return d;
  }

  async obtenerResumenPublico(id: string) {
    const r = await this.prisma.reservation.findUnique({
      where: { id },
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
      // 1. Buscar token
      const token = await tx.token.findUnique({
        where: { tokenHash },
        include: {
          reservation: true,
        },
      });

      if (!token) {
        throw new NotFoundException('Token inválido.');
      }

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

      // 2. Validar estado de la reserva
      if (token.reservation.status === 'CANCELADA') {
        throw new BadRequestException('La reserva ya está cancelada.');
      }

      if (token.reservation.status === 'COMPLETADA') {
        throw new BadRequestException(
          'No se puede cancelar una reserva completada.',
        );
      }

      // 3. Cancelar reserva
      const reservaCancelada = await tx.reservation.update({
        where: { id: token.reservation.id },
        data: {
          status: 'CANCELADA',
          canceledAt: new Date(),
        },
      });

      // 4. Marcar token como usado
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

    // Hacemos DB en transacción y devolvemos datos para enviar correo fuera
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Buscar token
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
      if (token.usedAt)
        throw new BadRequestException('Este enlace ya fue utilizado.');
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

      // 2. Recalcular endAt usando duración final
      const nuevaFin = new Date(
        nuevoInicio.getTime() + reserva.durationFinalMin * 60 * 1000,
      );

      // 3. Validar solapamiento
      const conflicto = await tx.reservation.findFirst({
        where: {
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

      // 4. Actualizar reserva
      const reservaActualizada = await tx.reservation.update({
        where: { id: reserva.id },
        data: {
          startAt: nuevoInicio,
          endAt: nuevaFin,
        },
        select: {
          id: true,
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

      // 5. Marcar token como usado
      await tx.token.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });

      // 6. Crear NUEVO token de gestión (para la nueva hora)
      const tokenPlanoNuevo = generarTokenSeguro(32);
      const tokenHashNuevo = hashToken(tokenPlanoNuevo);

      // Por seguridad: invalidar otros tokens activos de gestión para esta reserva
      await tx.token.updateMany({
        where: {
          reservationId: reservaActualizada.id,
          type: 'GESTION_RESERVA',
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      await tx.token.create({
        data: {
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

    // Enviar correo fuera de la transacción con NUEVO resumen + NUEVO link
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
}
