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
  private async obtenerBarberoId(userId: string) {
    const barbero = await this.prisma.barber.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!barbero) {
      throw new NotFoundException("Perfil de barbero no encontrado.");
    }

    return barbero.id;
  }

  /* ===== listar ===== */
  async listarMisImagenes(userId: string) {
    const barberoId = await this.obtenerBarberoId(userId);

    return this.prisma.portfolioImage.findMany({
      where: { barberId: barberoId },
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
  async crearImagen(userId: string, imageUrl: string) {
    const barberoId = await this.obtenerBarberoId(userId);

    const maxPos = await this.prisma.portfolioImage.aggregate({
      where: { barberId: barberoId },
      _max: { position: true },
    });

    const nextPosition = (maxPos._max.position ?? -1) + 1;

    return this.prisma.portfolioImage.create({
      data: {
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
    userId: string,
    imagenId: string,
    visible: boolean,
  ) {
    const barberoId = await this.obtenerBarberoId(userId);

    const imagen = await this.prisma.portfolioImage.findUnique({
      where: { id: imagenId },
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
    userId: string,
    items: { id: string; position: number }[],
  ) {
    const barberoId = await this.obtenerBarberoId(userId);

    if (!items.length) return { ok: true };

    const ids = items.map((i) => i.id);

    const existentes = await this.prisma.portfolioImage.findMany({
      where: { id: { in: ids } },
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