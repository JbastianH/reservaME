import { Body, Controller, Get, Patch, Param, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { Auth } from "../../common/decorators/auth.decorator";
import { ResenasService } from "./resenas.service";
import { ListarResenasQueryDto } from "./dto/listar-resenas.query.dto";

type RequestAutenticado = Request & { user: { id: string } };

@Auth("BARBERO")
@Controller("barbero/resenas")
export class BarberoResenasController {
  constructor(private readonly service: ResenasService) {}

  @Get()
  listar(@Req() req: RequestAutenticado, @Query() query: ListarResenasQueryDto) {
    return this.service.listarBarbero(req.user.id, query);
  }
  @Patch(":reviewId/visible")
  setVisible(
    @Req() req: RequestAutenticado,
    @Param("reviewId") reviewId: string,
    @Body() body: { visible: boolean },
  ) {
    return this.service.setVisibleComoBarbero(req.user.id, reviewId, body.visible);
  }
}