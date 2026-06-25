import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";

@Injectable()
export class PortafolioService {
  constructor(private readonly prisma: PrismaService) {}

  /* ===== helpers ===== */
  private async obtenerBarberoId(tenantId: string, userId: string) {
    const barbero = await this.prisma.barber.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!barbero) {
      throw new NotFoundException("Perfil de barbero no encontrado.");
    }

    return barbero.id;
  }

  /* ===== listar ===== */
  async listarMisImagenes(tenantId: string, userId: string) {
    const barberoId = await this.obtenerBarberoId(tenantId, userId);

    return this.prisma.portfolioImage.findMany({
      where: { tenantId, barberId: barberoId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        imageUrl: true,
        position: true,
        visible: true,
        hiddenByAdmin: true,
        createdAt: true,
      },
    });
  }

  /* ===== crear ===== */
  async crearImagen(tenantId: string, userId: string, imageUrl: string) {
    const barberoId = await this.obtenerBarberoId(tenantId, userId);

    const maxPos = await this.prisma.portfolioImage.aggregate({
      where: { tenantId, barberId: barberoId },
      _max: { position: true },
    });

    const nextPosition = (maxPos._max.position ?? -1) + 1;

    return this.prisma.portfolioImage.create({
      data: {
        tenantId,
        barberId: barberoId,
        imageUrl: imageUrl.trim(),
        position: nextPosition,
        visible: true,
        hiddenByAdmin: false,
      },
      select: {
        id: true,
        imageUrl: true,
        position: true,
        visible: true,
        hiddenByAdmin: true,
        createdAt: true,
      },
    });
  }

  /* ===== mostrar / ocultar ===== */
  async setVisible(
    tenantId: string,
    userId: string,
    imagenId: string,
    visible: boolean,
  ) {
    const barberoId = await this.obtenerBarberoId(tenantId, userId);

    const imagen = await this.prisma.portfolioImage.findFirst({
      where: { id: imagenId, tenantId },
      select: { id: true, barberId: true, hiddenByAdmin: true },
    });

    if (!imagen) {
      throw new NotFoundException("Imagen no encontrada.");
    }

    if (imagen.barberId !== barberoId) {
      throw new ForbiddenException("No tienes permiso sobre esta imagen.");
    }

    if (imagen.hiddenByAdmin && visible === true) {
      throw new ForbiddenException(
        "La imagen fue ocultada por el administrador.",
      );
    }

    return this.prisma.portfolioImage.update({
      where: { id: imagenId },
      data: { visible },
      select: {
        id: true,
        imageUrl: true,
        position: true,
        visible: true,
        hiddenByAdmin: true,
      },
    });
  }

  /* ===== reordenar ===== */
  async reordenar(
    tenantId: string,
    userId: string,
    items: { id: string; position: number }[],
  ) {
    const barberoId = await this.obtenerBarberoId(tenantId, userId);

    if (!items.length) return { ok: true };

    const ids = items.map((i) => i.id);

    const existentes = await this.prisma.portfolioImage.findMany({
      where: { tenantId, id: { in: ids } },
      select: { id: true, barberId: true },
    });

    if (existentes.length !== ids.length) {
      throw new NotFoundException("Una o más imágenes no existen.");
    }

    const noPropias = existentes.some(
      (img) => img.barberId !== barberoId,
    );
    if (noPropias) {
      throw new ForbiddenException("No puedes reordenar imágenes ajenas.");
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.portfolioImage.update({
          where: { id: item.id },
          data: { position: item.position },
        }),
      ),
    );

    return { ok: true };
  }
}