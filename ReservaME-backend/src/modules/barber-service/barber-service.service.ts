import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { AsignarServicioBarberoDto } from "./dto/asignar-servicio-barbero.dto";
import { ActualizarServicioBarberoDto } from "./dto/actualizar-servicio-barbero.dto";

@Injectable()
export class BarberServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // ADMIN
  // =========================

  async asignar(barberId: string, dto: AsignarServicioBarberoDto) {
    const barber = await this.prisma.barber.findUnique({
      where: { id: barberId },
      select: { id: true },
    });
    if (!barber) throw new NotFoundException("Barbero no encontrado.");

    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      select: { id: true },
    });
    if (!service) throw new NotFoundException("Servicio no encontrado.");

    const existe = await this.prisma.barberService.findFirst({
      where: { barberId, serviceId: dto.serviceId },
      select: { id: true },
    });
    if (existe) throw new BadRequestException("Ese servicio ya está asignado a este barbero.");

    return this.prisma.barberService.create({
      data: {
        barberId,
        serviceId: dto.serviceId,
        price: dto.price, // ✅ string
        durationMin: dto.durationMin,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listarPorBarbero(barberId: string) {
    const barber = await this.prisma.barber.findUnique({
      where: { id: barberId },
      select: { id: true },
    });
    if (!barber) throw new NotFoundException("Barbero no encontrado.");

    return this.prisma.barberService.findMany({
      where: { barberId },
      orderBy: { createdAt: "desc" },
      include: {
        service: { select: { id: true, name: true, description: true, isActive: true } },
      },
    });
  }

  async actualizar(
    barberId: string,
    barberServiceId: string,
    dto: ActualizarServicioBarberoDto,
  ) {
    const existe = await this.prisma.barberService.findFirst({
      where: { id: barberServiceId, barberId },
      select: { id: true },
    });
    if (!existe) throw new NotFoundException("Asignación barbero-servicio no encontrada.");

    return this.prisma.barberService.update({
      where: { id: barberServiceId },
      data: {
        price: dto.price ?? undefined,
        durationMin: dto.durationMin ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
  }

  async cambiarActivo(barberId: string, barberServiceId: string, isActive: boolean) {
    const existe = await this.prisma.barberService.findFirst({
      where: { id: barberServiceId, barberId },
      select: { id: true },
    });
    if (!existe) throw new NotFoundException("Asignación barbero-servicio no encontrada.");

    return this.prisma.barberService.update({
      where: { id: barberServiceId },
      data: { isActive },
    });
  }

  // =========================
  // BARBERO
  // =========================

  async listarPorBarberoAutenticado(userId: string, opts?: { activos?: boolean }) {
    const barber = await this.prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      throw new NotFoundException("No se encontró el perfil de barbero asociado a tu usuario.");
    }

    return this.prisma.barberService.findMany({
      where: {
        barberId: barber.id,
        ...(opts?.activos !== undefined ? { isActive: opts.activos } : {}),
      },
      orderBy: { createdAt: "asc" },
      include: {
        service: { select: { id: true, name: true, description: true, isActive: true } },
      },
    });
  }

  async actualizarPorBarberoAutenticado(
    userId: string,
    barberServiceId: string,
    dto: ActualizarServicioBarberoDto,
  ) {
    const barber = await this.prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barber) {
      throw new NotFoundException("No se encontró el perfil de barbero asociado a tu usuario.");
    }

    const bs = await this.prisma.barberService.findUnique({
      where: { id: barberServiceId },
      select: { id: true, barberId: true },
    });

    if (!bs) throw new NotFoundException("Servicio del barbero no encontrado.");
    if (bs.barberId !== barber.id) {
      throw new BadRequestException("No tienes permiso para editar este servicio.");
    }

    return this.prisma.barberService.update({
      where: { id: barberServiceId },
      data: {
        price: dto.price ?? undefined,
        durationMin: dto.durationMin ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
  }
}