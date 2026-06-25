import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, TokenType } from "@prisma/client";
import { PrismaService } from "../../config/prisma.service";
import { hashToken } from "../../common/utils/tokens.util";
import { CrearResenaPublicaDto } from "./dto/crear-resena-publica.dto";
import { ListarResenasQueryDto } from "./dto/listar-resenas.query.dto";

@Injectable()
export class ResenasService {
  constructor(private readonly prisma: PrismaService) {}

  async crearPublica(dto: CrearResenaPublicaDto) {
    const tokenHash = hashToken(dto.token);

    const token = await this.prisma.token.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        tenantId: true,
        type: true,
        reservationId: true,
        expiresAt: true,
        usedAt: true,
        reservation: {
          select: {
            id: true,
            tenantId: true,
            barberId: true,
            status: true,
          },
        },
      },
    });

    if (!token) throw new NotFoundException("El link de reseña no es válido.");

    if (token.type !== TokenType.RESENA) {
      throw new BadRequestException("El link no corresponde a una reseña.");
    }

    if (!token.tenantId) {
      throw new BadRequestException("El link de reseña no tiene tenant asociado.");
    }

    if (!token.reservationId || !token.reservation) {
      throw new BadRequestException("El link de reseña no es válido.");
    }

    if (token.reservation.tenantId !== token.tenantId) {
      throw new BadRequestException("El link de reseña no corresponde a esta reserva.");
    }

    if (token.usedAt) throw new BadRequestException("Este link ya fue utilizado.");

    if (token.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException("Este link expiró. Solicita uno nuevo.");
    }

    if (token.reservation.status !== "COMPLETADA") {
      throw new BadRequestException(
        "Solo se puede dejar reseña cuando el servicio está completado.",
      );
    }

    const rating = dto.rating;

    return this.prisma.$transaction(async (tx) => {
      const existe = await tx.review.findFirst({
        where: {
          tenantId: token.tenantId!,
          reservationId: token.reservationId!,
        },
        select: { id: true },
      });

      if (existe) {
        throw new BadRequestException(
          "Esta reserva ya tiene una reseña registrada.",
        );
      }

      const review = await tx.review.create({
        data: {
          tenantId: token.tenantId!,
          reservationId: token.reservationId!,
          barberId: token.reservation!.barberId,
          rating,
          comment: dto.comment?.trim() ?? null,
          visible: true,
        },
      });

      await tx.token.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });

      return { ok: true, review };
    });
  }

  async listarAdmin(tenantId: string, query: ListarResenasQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ReviewWhereInput = {
      tenantId,
      ...(query.barberId ? { barberId: query.barberId } : {}),
      ...(query.visible === undefined ? {} : { visible: query.visible }),
      ...(query.q
        ? {
            OR: [
              { comment: { contains: query.q, mode: "insensitive" } },
              { barber: { name: { contains: query.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          reservationId: true,
          barberId: true,
          rating: true,
          comment: true,
          visible: true,
          createdAt: true,
          updatedAt: true,
          reservation: {
            select: {
              clientName: true,
            },
          },
          barber: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    return { page, pageSize, total, items };
  }

  async listarBarbero(
    tenantId: string,
    userId: string,
    query: ListarResenasQueryDto,
  ) {
    const barber = await this.prisma.barber.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!barber) {
      throw new NotFoundException(
        "No se encontró el perfil de barbero asociado a tu usuario.",
      );
    }

    return this.listarAdmin(tenantId, { ...query, barberId: barber.id });
  }

  async setVisibleComoAdmin(
    tenantId: string,
    reviewId: string,
    visible: boolean,
  ) {
    const existe = await this.prisma.review.findFirst({
      where: { id: reviewId, tenantId },
      select: { id: true },
    });

    if (!existe) throw new NotFoundException("Reseña no encontrada.");

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { visible },
    });

    return { ok: true, review: updated };
  }

  async setVisibleComoBarbero(
    tenantId: string,
    userId: string,
    reviewId: string,
    visible: boolean,
  ) {
    const barber = await this.prisma.barber.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!barber) {
      throw new NotFoundException(
        "No se encontró el perfil de barbero asociado a tu usuario.",
      );
    }

    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, tenantId },
      select: { id: true, barberId: true },
    });

    if (!review) throw new NotFoundException("Reseña no encontrada.");

    if (review.barberId !== barber.id) {
      throw new BadRequestException(
        "No tienes permiso para modificar esta reseña.",
      );
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { visible },
    });

    return { ok: true, review: updated };
  }
}