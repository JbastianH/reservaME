import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import type { TenantRequest } from "../../common/tenant/tenant-request.interface";
import { Auth } from "../../common/decorators/auth.decorator";
import { PortafolioService } from "./portafolio.service";
import { CrearPortafolioDto } from "./dto/crear-portafolio.dto";
import { SetVisiblePortafolioDto } from "./dto/set-visible-portafolio.dto";
import { ReordenarPortafolioDto } from "./dto/reordenar-portafolio.dto";

type RequestAutenticado = TenantRequest & Request & { user?: { sub?: string } };

@Auth("BARBERO")
@Controller("barbero/portafolio")
export class PortafolioBarberoController {
  constructor(private readonly service: PortafolioService) {}

  @Get()
  listar(@Req() req: RequestAutenticado) {
    return this.service.listarMisImagenes(req.tenant!.id, req.user!.sub!);
  }

  @Post()
  crear(
    @Req() req: RequestAutenticado,
    @Body() dto: CrearPortafolioDto,
  ) {
    return this.service.crearImagen(req.tenant!.id, req.user!.sub!, dto.imageUrl);
  }

  @Patch(":id/visible")
  setVisible(
    @Req() req: RequestAutenticado,
    @Param("id") id: string,
    @Body() dto: SetVisiblePortafolioDto,
  ) {
    return this.service.setVisible(req.tenant!.id, req.user!.sub!, id, dto.visible);
  }

  @Patch("reordenar")
  reordenar(
    @Req() req: RequestAutenticado,
    @Body() dto: ReordenarPortafolioDto,
  ) {
    return this.service.reordenar(req.tenant!.id, req.user!.sub!, dto.items);
  }
}