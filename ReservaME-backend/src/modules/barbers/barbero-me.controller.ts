import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import type { Request } from "express";
import { Auth } from "../../common/decorators/auth.decorator";
import { BarbersService } from "./barbers.service";
import { ActualizarMiPerfilDto } from "./dto/actualizar-mi-perfil.dto";

type RequestAutenticado = Request & { user?: { sub?: string } };

@Auth("BARBERO")
@Controller("barbero/me")
export class BarberoMeController {
  constructor(private readonly service: BarbersService) {}

  @Get()
  me(@Req() req: RequestAutenticado) {
    const userId = req.user?.sub;
    return this.service.obtenerMiPerfil(userId!);
  }

  @Patch()
  actualizar(@Req() req: RequestAutenticado, @Body() dto: ActualizarMiPerfilDto) {
    const userId = req.user?.sub;
    return this.service.actualizarMiPerfil(userId!, dto);
  }
}