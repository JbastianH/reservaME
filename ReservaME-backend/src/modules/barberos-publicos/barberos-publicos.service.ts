import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class BarberosPublicosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(q?: string) {
    const term = q?.trim();

    return this.prisma.barber.findMany({
      where: {
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
        linkSetmore: true,
        photoUrl: true,
      },
    });
  }

  async obtenerPorSlug(slug: string) {
    const barber = await this.prisma.barber.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        phone: true,
        linkSetmore: true,
        photoUrl: true,

        services: {
          where: { isActive: true },
          select: {
            id: true,
            price: true,
            durationMin: true,
            service: {
              select: { id: true, name: true, description: true },
            },
          },
        },

        portfolioImages: {
          where: { visible: true, hiddenByAdmin: false },
          orderBy: { position: 'asc' },
          select: { id: true, imageUrl: true, position: true },
        },
      },
    });

    if (!barber) throw new NotFoundException('Barbero no encontrado.');
    return barber;
  }

  async listarServiciosPorSlug(slug: string) {
    const barber = await this.prisma.barber.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });

    if (!barber || !barber.isActive) {
      throw new NotFoundException('Barbero no encontrado.');
    }

    return this.prisma.barberService.findMany({
      where: {
        barberId: barber.id,
        isActive: true,
        service: { isActive: true },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        barberId: true,
        serviceId: true,
        price: true, // Decimal -> normalmente llega como string en JSON
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

  async listarResenasPorSlug(slug: string, take: number) {
    const barber = await this.prisma.barber.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });

    if (!barber || !barber.isActive) {
      throw new NotFoundException('Barbero no encontrado.');
    }

    return this.prisma.review.findMany({
      where: {
        barberId: barber.id,
        visible: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reservation: {
          select: {
            clientName: true, // para mostrar “Juan P.”
            service: { select: { name: true } },
          },
        },
      },
    });
  }
}
