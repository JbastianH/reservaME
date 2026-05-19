import { Body, Controller, Param, Patch } from "@nestjs/common";
import { Auth } from "../../common/decorators/auth.decorator";
import { PrismaService } from "../../config/prisma.service";
import { SetVisiblePortafolioDto } from "./dto/set-visible-portafolio.dto";

@Auth("ADMIN")
@Controller("admin/portafolio")
export class PortafolioAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch(":id/ocultar")
  ocultar(@Param("id") id: string) {
    return this.prisma.portfolioImage.update({
      where: { id },
      data: { hiddenByAdmin: true },
      select: { id: true, hiddenByAdmin: true },
    });
  }

  @Patch(":id/restaurar")
  restaurar(@Param("id") id: string) {
    return this.prisma.portfolioImage.update({
      where: { id },
      data: { hiddenByAdmin: false },
      select: { id: true, hiddenByAdmin: true },
    });
  }

  @Patch(":id/visible")
  setVisible(
    @Param("id") id: string,
    @Body() dto: SetVisiblePortafolioDto,
  ) {
    return this.prisma.portfolioImage.update({
      where: { id },
      data: { visible: dto.visible },
      select: { id: true, visible: true },
    });
  }
}