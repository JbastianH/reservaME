import { Controller, Get, Query, Req } from "@nestjs/common";
import { DisponibilidadPublicaService } from "./disponibilidad-publica.service";
import type { TenantRequest } from "../../common/tenant/tenant-request.interface";

@Controller("public/disponibilidad")
export class DisponibilidadPublicaController {
  constructor(private readonly service: DisponibilidadPublicaService) {}

  @Get()
  obtener(
    @Req() req: TenantRequest,
    @Query("slug") slug: string,
    @Query("date") date: string,
  ) {
    return this.service.obtenerDisponibilidad(
      req.tenant!.id,
      slug,
      date,
    );
  }
}