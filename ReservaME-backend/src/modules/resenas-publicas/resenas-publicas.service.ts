import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CrearResenaPublicaDto } from './dto/crear-resena-publica.dto';
import { hashToken } from '../../common/utils/tokens.util';

@Injectable()
export class ResenasPublicasService {
  constructor(private readonly prisma: PrismaService) {}

  async crearConToken(tokenPlano: string, dto: CrearResenaPublicaDto) {
    const tokenHash = hashToken(tokenPlano);

    const token = await this.prisma.token.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        tenantId: true,
        type: true,
        usedAt: true,
        expiresAt: true,
        reservationId: true,
      },
    });

    if (!token) {
      throw new NotFoundException('El enlace de reseña no es válido.');
    }

    if (token.type !== 'RESENA') {
      throw new BadRequestException('Este enlace no corresponde a una reseña.');
    }

    if (!token.tenantId) {
      throw new BadRequestException('Token inválido (sin tenant asociado).');
    }

    if (!token.reservationId) {
      throw new BadRequestException('Token inválido (sin reserva asociada).');
    }

    if (token.usedAt) {
      throw new BadRequestException('Este enlace de reseña ya fue utilizado.');
    }

    if (token.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Este enlace de reseña expiró. Solicita uno nuevo.',
      );
    }

    const reserva = await this.prisma.reservation.findFirst({
      where: {
        id: token.reservationId,
        tenantId: token.tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        status: true,
        barberId: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException('La reserva asociada ya no existe.');
    }

    if (reserva.status !== 'COMPLETADA') {
      throw new BadRequestException(
        'Solo puedes dejar una reseña cuando el servicio esté completado.',
      );
    }

    const yaExiste = await this.prisma.review.findFirst({
      where: {
        tenantId: token.tenantId,
        reservationId: reserva.id,
      },
      select: { id: true },
    });

    if (yaExiste) {
      throw new BadRequestException(
        'Esta reserva ya tiene una reseña registrada.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          tenantId: token.tenantId!,
          reservationId: reserva.id,
          barberId: reserva.barberId,
          rating: dto.rating,
          comment: dto.comment?.trim() ?? null,
          visible: true,
        },
      });

      await tx.token.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });

      return review;
    });

    return {
      ok: true,
      mensaje: '¡Gracias! Tu reseña fue registrada.',
      review: result,
    };
  }

  async obtenerPorToken(tokenPlano: string) {
    const tokenHash = hashToken(tokenPlano);

    const token = await this.prisma.token.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        tenantId: true,
        type: true,
        usedAt: true,
        expiresAt: true,
        reservationId: true,
      },
    });

    if (!token) {
      throw new NotFoundException('El enlace de reseña no es válido.');
    }

    if (token.type !== 'RESENA') {
      throw new BadRequestException('Este enlace no corresponde a una reseña.');
    }

    if (!token.tenantId) {
      throw new BadRequestException('Token inválido (sin tenant asociado).');
    }

    if (!token.reservationId) {
      throw new BadRequestException('Token inválido (sin reserva asociada).');
    }

    if (token.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Este enlace de reseña expiró. Solicita uno nuevo.',
      );
    }

    const reserva = await this.prisma.reservation.findFirst({
      where: {
        id: token.reservationId,
        tenantId: token.tenantId,
      },
      select: {
        id: true,
        status: true,
        clientName: true,
        barber: { select: { id: true, name: true, slug: true } },
        service: { select: { id: true, name: true } },
        review: { select: { id: true } },
      },
    });

    if (!reserva) {
      throw new NotFoundException('La reserva asociada ya no existe.');
    }

    if (reserva.status !== 'COMPLETADA') {
      throw new BadRequestException(
        'Solo puedes dejar una reseña cuando el servicio esté completado.',
      );
    }

    const yaTieneResena = Boolean(reserva.review?.id);

    return {
      ok: true,
      token: {
        usedAt: token.usedAt,
        expiresAt: token.expiresAt,
      },
      reserva: {
        id: reserva.id,
        status: reserva.status,
        clientName: reserva.clientName,
        barber: reserva.barber,
        service: reserva.service,
      },
      yaTieneResena,
    };
  }
}
