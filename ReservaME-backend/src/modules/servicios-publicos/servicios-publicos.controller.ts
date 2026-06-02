import { Controller, Get, Query, Req } from "@nestjs/common";
import { ServiciosService } from "../servicios/servicios.service";
import type { TenantRequest } from "../../common/tenant/tenant-request.interface";

@Controller("public/servicios")
export class ServiciosPublicosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Get()
  listar(@Req() req: TenantRequest, @Query("q") q?: string) {
    return this.serviciosService.listarPublico(req.tenant!.id, q);
  }
}