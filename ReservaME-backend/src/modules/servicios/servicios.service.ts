import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Service as Servicio } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(tenantId: string, dto: CreateServicioDto): Promise<Servicio> {
    const name = dto.name.trim();

    const existe = await this.prisma.service.findFirst({
      where: {
        tenantId,
        name: { equals: name, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (existe) {
      throw new BadRequestException('Ya existe un servicio con ese nombre.');
    }

    return this.prisma.service.create({
      data: {
        tenantId,
        name,
        description: dto.description?.trim() ?? null,
        basePrice:
          dto.basePrice === undefined || dto.basePrice === null
            ? null
            : new Prisma.Decimal(dto.basePrice),
        baseDurationMin: dto.baseDurationMin ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listar(tenantId: string): Promise<Servicio[]> {
    return this.prisma.service.findMany({
      where: {
        tenantId,
      },
      orderBy: { name: 'asc' },
    });
  }

  async obtenerPorId(tenantId: string, id: string): Promise<Servicio> {
    const servicio = await this.prisma.service.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!servicio) throw new NotFoundException('Servicio no encontrado.');
    return servicio;
  }

  async actualizar(
    tenantId: string,
    id: string,
    dto: UpdateServicioDto,
  ): Promise<Servicio> {
    await this.obtenerPorId(tenantId, id);

    if (dto.name) {
      const name = dto.name.trim();

      const existe = await this.prisma.service.findFirst({
        where: {
          tenantId,
          name: { equals: name, mode: 'insensitive' },
          NOT: { id },
        },
        select: { id: true },
      });

      if (existe) {
        throw new BadRequestException('Ya existe un servicio con ese nombre.');
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description:
          dto.description === undefined ? undefined : dto.description?.trim() ?? null,
        basePrice:
          dto.basePrice === undefined
            ? undefined
            : dto.basePrice === null
              ? null
              : new Prisma.Decimal(dto.basePrice),
        baseDurationMin:
          dto.baseDurationMin === undefined ? undefined : dto.baseDurationMin,
        isActive: dto.isActive === undefined ? undefined : dto.isActive,
      },
    });
  }

  async desactivar(tenantId: string, id: string): Promise<Servicio> {
    await this.obtenerPorId(tenantId, id);

    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activar(tenantId: string, id: string) {
    const existe = await this.prisma.service.findFirst({
      where: {
        id,
        tenantId,
      },
      select: { id: true },
    });

    if (!existe) throw new NotFoundException('Servicio no encontrado.');

    const updated = await this.prisma.service.update({
      where: { id },
      data: { isActive: true },
    });

    return { ok: true, servicio: updated };
  }

  async listarPublico(tenantId: string, q?: string): Promise<Servicio[]> {
    const query = q?.trim();

    return this.prisma.service.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(query
          ? {
              name: { contains: query, mode: 'insensitive' },
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }
}