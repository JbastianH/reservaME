import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  Req,
} from "@nestjs/common";
import { Auth } from "../../common/decorators/auth.decorator";
import { PrismaService } from "../../config/prisma.service";
import { SetVisiblePortafolioDto } from "./dto/set-visible-portafolio.dto";
import type { TenantRequest } from "../../common/tenant/tenant-request.interface";

@Auth("ADMIN")
@Controller("admin/portafolio")
export class PortafolioAdminController {
  constructor(private readonly prisma: PrismaService) {}

  private async validarImagenDelTenant(tenantId: string, id: string) {
    const imagen = await this.prisma.portfolioImage.findFirst({
      where: {
        id,
        tenantId,
      },
      select: { id: true },
    });

    if (!imagen) {
      throw new NotFoundException("Imagen no encontrada.");
    }
  }

  @Patch(":id/ocultar")
  async ocultar(@Req() req: TenantRequest, @Param("id") id: string) {
    await this.validarImagenDelTenant(req.tenant!.id, id);

    return this.prisma.portfolioImage.update({
      where: { id },
      data: { hiddenByAdmin: true },
      select: { id: true, hiddenByAdmin: true },
    });
  }

  @Patch(":id/restaurar")
  async restaurar(@Req() req: TenantRequest, @Param("id") id: string) {
    await this.validarImagenDelTenant(req.tenant!.id, id);

    return this.prisma.portfolioImage.update({
      where: { id },
      data: { hiddenByAdmin: false },
      select: { id: true, hiddenByAdmin: true },
    });
  }

  @Patch(":id/visible")
  async setVisible(
    @Req() req: TenantRequest,
    @Param("id") id: string,
    @Body() dto: SetVisiblePortafolioDto,
  ) {
    await this.validarImagenDelTenant(req.tenant!.id, id);

    return this.prisma.portfolioImage.update({
      where: { id },
      data: { visible: dto.visible },
      select: { id: true, visible: true },
    });
  }
}