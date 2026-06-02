import { Controller, Get, Patch, Body, Req } from "@nestjs/common";
import { Auth } from "../../common/decorators/auth.decorator";
import { HorarioBarberoService } from "./horario-barbero.service";
import type { Request } from "express";
import type { TenantRequest } from "../../common/tenant/tenant-request.interface";

type ReqAuth = TenantRequest & Request & { user?: { sub?: string } };

@Auth("BARBERO")
@Controller("barbero/horario")
export class HorarioBarberoController {
  constructor(private readonly service: HorarioBarberoService) {}

  @Get()
  listar(@Req() req: ReqAuth) {
    return this.service.obtenerHorario(req.tenant!.id, req.user!.sub!);
  }

  @Patch()
  actualizar(@Req() req: ReqAuth, @Body() body: any[]) {
    return this.service.actualizarHorario(req.tenant!.id, req.user!.sub!, body);
  }
}