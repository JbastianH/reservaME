import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CrearBarberTimeBlockDto } from './dto/crear-barber-time-block.dto';
import { ListarBarberTimeBlocksQueryDto } from './dto/listar-barber-time-blocks.query.dto';

type UsuarioAutenticado = {
  id?: string;
  sub?: string;
  role?: string;
  tenantId?: string | null;
  email?: string;
};

@Injectable()
export class BarberTimeBlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    tenantId: string,
    user: UsuarioAutenticado | undefined,
    query: ListarBarberTimeBlocksQueryDto,
  ) {
    const barberId = await this.obtenerBarberIdParaConsulta(
      tenantId,
      user,
      query.barberId,
    );

    const from = this.parseDateOrUndefined(query.from, 'from');
    const to = this.parseDateOrUndefined(query.to, 'to');

    return this.prisma.barberTimeBlock.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(barberId ? { barberId } : {}),
        ...(from || to
          ? {
              startAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lt: to } : {}),
              },
            }
          : {}),
      },
      orderBy: {
        startAt: 'asc',
      },
      select: {
        id: true,
        tenantId: true,
        barberId: true,
        startAt: true,
        endAt: true,
        reason: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        barber: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async crear(
    tenantId: string,
    user: UsuarioAutenticado | undefined,
    dto: CrearBarberTimeBlockDto,
  ) {
    const barberId = await this.obtenerBarberIdPermitido(
      tenantId,
      user,
      dto.barberId,
    );

    const startAt = this.parseDateOrThrow(dto.startAtIso, 'startAtIso');

    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

    const conflictoBloqueo = await this.prisma.barberTimeBlock.findFirst({
      where: {
        tenantId,
        barberId,
        isActive: true,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: {
        id: true,
      },
    });

    if (conflictoBloqueo) {
      throw new BadRequestException(
        'Ya existe un bloqueo en ese horario para este barbero.',
      );
    }

    const conflictoReserva = await this.prisma.reservation.findFirst({
      where: {
        tenantId,
        barberId,
        status: 'CONFIRMADA',
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: {
        id: true,
      },
    });

    if (conflictoReserva) {
      throw new BadRequestException(
        'No puedes bloquear este horario porque ya existe una reserva confirmada.',
      );
    }

    const bloqueoExistenteMismaHora =
      await this.prisma.barberTimeBlock.findUnique({
        where: {
          tenantId_barberId_startAt: {
            tenantId,
            barberId,
            startAt,
          },
        },
        select: {
          id: true,
          isActive: true,
        },
      });

    if (bloqueoExistenteMismaHora?.isActive) {
      throw new BadRequestException(
        'Ya existe un bloqueo en ese horario para este barbero.',
      );
    }

    if (bloqueoExistenteMismaHora && !bloqueoExistenteMismaHora.isActive) {
      return this.prisma.barberTimeBlock.update({
        where: {
          id: bloqueoExistenteMismaHora.id,
        },
        data: {
          endAt,
          reason: dto.reason?.trim() || null,
          isActive: true,
        },
        select: {
          id: true,
          tenantId: true,
          barberId: true,
          startAt: true,
          endAt: true,
          reason: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          barber: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    }

    return this.prisma.barberTimeBlock.create({
      data: {
        tenantId,
        barberId,
        startAt,
        endAt,
        reason: dto.reason?.trim() || null,
      },
      select: {
        id: true,
        tenantId: true,
        barberId: true,
        startAt: true,
        endAt: true,
        reason: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        barber: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async eliminar(
    tenantId: string,
    user: UsuarioAutenticado | undefined,
    blockId: string,
  ) {
    const block = await this.prisma.barberTimeBlock.findFirst({
      where: {
        id: blockId,
        tenantId,
        isActive: true,
      },
      select: {
        id: true,
        barberId: true,
      },
    });

    if (!block) {
      throw new NotFoundException('Bloque horario no encontrado.');
    }

    await this.validarPermisoSobreBarbero(tenantId, user, block.barberId);

    const updated = await this.prisma.barberTimeBlock.update({
      where: {
        id: block.id,
      },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        tenantId: true,
        barberId: true,
        startAt: true,
        endAt: true,
        reason: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return {
      ok: true,
      block: updated,
    };
  }

  private parseDateOrThrow(value: string, campo: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `El parámetro "${campo}" tiene un formato inválido.`,
      );
    }

    return date;
  }

  private parseDateOrUndefined(value?: string, campo?: string) {
    if (!value) return undefined;
    return this.parseDateOrThrow(value, campo ?? 'fecha');
  }

  private obtenerUserId(user?: UsuarioAutenticado) {
    return user?.id ?? user?.sub;
  }

  private async obtenerBarberIdPermitido(
    tenantId: string,
    user: UsuarioAutenticado | undefined,
    barberId?: string,
  ) {
    if (user?.role === 'BARBERO') {
      const userId = this.obtenerUserId(user);

      if (!userId) {
        throw new ForbiddenException('No se pudo identificar el usuario.');
      }

      const barber = await this.prisma.barber.findFirst({
        where: {
          tenantId,
          userId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!barber) {
        throw new NotFoundException(
          'No se encontró el perfil de barbero asociado a tu usuario.',
        );
      }

      if (barberId && barberId !== barber.id) {
        throw new ForbiddenException(
          'No tienes permiso para gestionar bloqueos de otro barbero.',
        );
      }

      return barber.id;
    }

    if (!barberId) {
      throw new BadRequestException('Debes indicar el barbero.');
    }

    const barber = await this.prisma.barber.findFirst({
      where: {
        id: barberId,
        tenantId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!barber) {
      throw new NotFoundException('Barbero no encontrado.');
    }

    return barber.id;
  }

  private async obtenerBarberIdParaConsulta(
    tenantId: string,
    user: UsuarioAutenticado | undefined,
    barberId?: string,
  ) {
    if (user?.role === 'BARBERO') {
      return this.obtenerBarberIdPermitido(tenantId, user, barberId);
    }

    if (!barberId) {
      return undefined;
    }

    return this.obtenerBarberIdPermitido(tenantId, user, barberId);
  }

  private async validarPermisoSobreBarbero(
    tenantId: string,
    user: UsuarioAutenticado | undefined,
    barberId: string,
  ) {
    if (user?.role !== 'BARBERO') return;

    const barberIdPermitido = await this.obtenerBarberIdPermitido(
      tenantId,
      user,
      barberId,
    );

    if (barberIdPermitido !== barberId) {
      throw new ForbiddenException(
        'No tienes permiso para gestionar este bloqueo.',
      );
    }
  }
}
