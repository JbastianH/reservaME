import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import type { Request } from "express";
import type { TenantRequest } from "../../common/tenant/tenant-request.interface";
import { Auth } from "../../common/decorators/auth.decorator";
import { BarbersService } from "./barbers.service";
import { ActualizarMiPerfilDto } from "./dto/actualizar-mi-perfil.dto";

type RequestAutenticado = TenantRequest & Request & { user?: { sub?: string } };

@Auth("BARBERO")
@Controller("barbero/me")
export class BarberoMeController {
  constructor(private readonly service: BarbersService) {}

  @Get()
  me(@Req() req: RequestAutenticado) {
    const userId = req.user?.sub;
    return this.service.obtenerMiPerfil(req.tenant!.id, userId!);
  }

  @Patch()
  actualizar(@Req() req: RequestAutenticado, @Body() dto: ActualizarMiPerfilDto) {
    const userId = req.user?.sub;
    return this.service.actualizarMiPerfil(req.tenant!.id, userId!, dto);
  }
}