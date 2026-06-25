import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class BarberosPublicosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(tenantId: string, q?: string) {
    const term = q?.trim();

    return this.prisma.barber.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { slug: { contains: term, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        phone: true,
        photoUrl: true,
      },
    });
  }

  async obtenerPorSlug(tenantId: string, slug: string) {
    const barber = await this.prisma.barber.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        phone: true,
        photoUrl: true,

        services: {
          where: {
            tenantId,
            isActive: true,
            service: {
              tenantId,
              isActive: true,
            },
          },
          select: {
            id: true,
            price: true,
            durationMin: true,
            service: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },

        portfolioImages: {
          where: {
            tenantId,
            visible: true,
            hiddenByAdmin: false,
          },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            imageUrl: true,
            position: true,
          },
        },
      },
    });

    if (!barber) throw new NotFoundException('Barbero no encontrado.');
    return barber;
  }

  async listarServiciosPorSlug(tenantId: string, slug: string) {
    const barber = await this.prisma.barber.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!barber || !barber.isActive) {
      throw new NotFoundException('Barbero no encontrado.');
    }

    return this.prisma.barberService.findMany({
      where: {
        tenantId,
        barberId: barber.id,
        isActive: true,
        service: {
          tenantId,
          isActive: true,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        barberId: true,
        serviceId: true,
        price: true,
        durationMin: true,
        isActive: true,
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
      },
    });
  }

  async listarResenasPorSlug(tenantId: string, slug: string, take: number) {
    const barber = await this.prisma.barber.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!barber || !barber.isActive) {
      throw new NotFoundException('Barbero no encontrado.');
    }

    return this.prisma.review.findMany({
      where: {
        tenantId,
        barberId: barber.id,
        visible: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reservation: {
          select: {
            clientName: true,
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }
}