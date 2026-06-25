import { Body, Controller, Get, Patch, Param, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import type { TenantRequest } from "../../common/tenant/tenant-request.interface";
import { Auth } from "../../common/decorators/auth.decorator";
import { ResenasService } from "./resenas.service";
import { ListarResenasQueryDto } from "./dto/listar-resenas.query.dto";

type RequestAutenticado = TenantRequest & Request & {
  user: { id: string; sub?: string };
};

@Auth("BARBERO")
@Controller("barbero/resenas")
export class BarberoResenasController {
  constructor(private readonly service: ResenasService) {}

  @Get()
  listar(@Req() req: RequestAutenticado, @Query() query: ListarResenasQueryDto) {
    const userId = req.user.sub ?? req.user.id;
    return this.service.listarBarbero(req.tenant!.id, userId, query);
  }
  @Patch(":reviewId/visible")
  setVisible(
    @Req() req: RequestAutenticado,
    @Param("reviewId") reviewId: string,
    @Body() body: { visible: boolean },
  ) {
    const userId = req.user.sub ?? req.user.id;
    return this.service.setVisibleComoBarbero(
      req.tenant!.id,
      userId,
      reviewId,
      body.visible,
    );
  }
}