import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CrearBarberoDto } from './dto/crear-barbero.dto';
import { ActualizarBarberoDto } from './dto/actualizar-barbero.dto';
import { ListarBarberosDto } from './dto/listar-barberos.dto';
import { normalizarSlug } from '../../common/utils/slug.util';
import { ActualizarMiPerfilDto } from './dto/actualizar-mi-perfil.dto';

@Injectable()
export class BarbersService {
  constructor(private readonly prisma: PrismaService) {}


  async crear(tenantId: string, dto: CrearBarberoDto) {

    const name = dto.name.trim();
    const slugBase = dto.slug ? dto.slug : normalizarSlug(name);
    const slug = normalizarSlug(slugBase);

    if (!slug) throw new BadRequestException('Slug inválido.');

    const existeSlug = await this.prisma.barber.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
      select: { id: true },
    });

    if (existeSlug) throw new BadRequestException('El slug ya está en uso.');

    if (dto.userId) {
      const user = await this.prisma.user.findFirst({
        where: {
          id: dto.userId,
          tenantId,
        },
        select: { id: true },
      });

      if (!user) throw new BadRequestException('El userId no existe.');

      const existeUserVinculado = await this.prisma.barber.findUnique({
        where: { userId: dto.userId },
        select: { id: true },
      });

      if (existeUserVinculado) {
        throw new BadRequestException(
          'Ese usuario ya está vinculado a otro barbero.',
        );
      }
    }

    return this.prisma.barber.create({
      data: {
        tenantId,
        userId: dto.userId ?? null,
        name,
        slug,
        bio: dto.bio?.trim() ?? null,
        phone: dto.phone?.trim() ?? null,
        photoUrl: dto.photoUrl?.trim() ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listar(tenantId: string, query: ListarBarberosDto) {

    const orderBy = query.orderBy ?? 'createdAt';
    const orderDir = query.orderDir ?? 'desc';

    return this.prisma.barber.findMany({
      where: {
        tenantId,
        isActive:
          typeof query.isActive === 'boolean' ? query.isActive : undefined,
        OR: query.q
          ? [
              { name: { contains: query.q, mode: 'insensitive' } },
              { slug: { contains: query.q, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { [orderBy]: orderDir },
      include: {
        user: {
          select: { email: true, isActive: true },
        },
      },
    });
  }

  async obtenerPorId(tenantId: string, id: string) {

    const barber = await this.prisma.barber.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!barber) throw new NotFoundException('Barbero no encontrado.');
    return barber;
  }

  async actualizar(tenantId: string, id: string, dto: ActualizarBarberoDto) {
    await this.obtenerPorId(tenantId, id);

    let slug: string | undefined = undefined;

    if (dto.slug) {
      slug = normalizarSlug(dto.slug);
      if (!slug) throw new BadRequestException('Slug inválido.');

      const existeSlug = await this.prisma.barber.findUnique({
        where: {
          tenantId_slug: {
            tenantId,
            slug,
          },
        },
        select: { id: true },
      });

      if (existeSlug && existeSlug.id !== id) {
        throw new BadRequestException('El slug ya está en uso.');
      }
    }

    if (dto.userId) {
      const user = await this.prisma.user.findFirst({
        where: {
          id: dto.userId,
          tenantId,
        },
        select: { id: true },
      });

      if (!user) throw new BadRequestException('El userId no existe.');

      const existeUserVinculado = await this.prisma.barber.findUnique({
        where: { userId: dto.userId },
        select: { id: true },
      });

      if (existeUserVinculado && existeUserVinculado.id !== id) {
        throw new BadRequestException(
          'Ese usuario ya está vinculado a otro barbero.',
        );
      }
    }

    return this.prisma.barber.update({
      where: { id },
      data: {
        userId: dto.userId === null ? null : (dto.userId ?? undefined),
        name: dto.name?.trim() ?? undefined,
        slug: slug ?? undefined,
        bio: dto.bio?.trim() ?? undefined,
        phone: dto.phone?.trim() ?? undefined,
        photoUrl: dto.photoUrl?.trim() ?? undefined,
        isActive: typeof dto.isActive === 'boolean' ? dto.isActive : undefined,
      },
    });
  }

  async desactivar(tenantId: string, id: string) {
    await this.obtenerPorId(tenantId, id);

    return this.prisma.barber.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activar(tenantId: string, id: string) {
    await this.obtenerPorId(tenantId, id);

    return this.prisma.barber.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async obtenerMiPerfil(tenantId: string, userId: string) {

    const barber = await this.prisma.barber.findFirst({
      where: {
        userId,
        tenantId,
      },
      include: {
        user: { select: { email: true, role: true, isActive: true } },
      },
    });

    if (!barber) throw new NotFoundException('Perfil de barbero no encontrado.');
    return barber;
  }

  async actualizarMiPerfil(
    tenantId: string,
    userId: string,
    dto: ActualizarMiPerfilDto,
  ) {

    const barber = await this.prisma.barber.findFirst({
      where: {
        userId,
        tenantId,
      },
      select: { id: true, userId: true },
    });

    if (!barber) throw new NotFoundException('Perfil de barbero no encontrado.');

    return this.prisma.barber.update({
      where: { id: barber.id },
      data: {
        bio: dto.bio?.trim() ?? undefined,
        phone: dto.phone?.trim() ?? undefined,
        photoUrl: dto.photoUrl?.trim() ?? undefined,
      },
    });
  }
}