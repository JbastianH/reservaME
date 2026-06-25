import { Body, Controller, Get, Patch, Param, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import type { TenantRequest } from "../../common/tenant/tenant-request.interface";
import { Auth } from "../../common/decorators/auth.decorator";
import { BarberServicesService } from "./barber-service.service";
import { ActualizarServicioBarberoDto } from "./dto/actualizar-servicio-barbero.dto";

type RequestAutenticado = TenantRequest & Request & { user?: { sub?: string } };

@Auth("BARBERO")
@Controller("barbero/servicios")
export class BarberoBarberServiciosController {
  constructor(private readonly service: BarberServicesService) {}

  // GET /barbero/servicios?activos=true|false
  @Get()
  listarMisServicios(@Req() req: RequestAutenticado, @Query("activos") activos?: string) {
    const userId = req.user?.sub;
    if (!userId) throw new Error("JWT sin sub en req.user"); // o UnauthorizedException si quieres

    const activosBool =
      activos === undefined
        ? undefined
        : activos === "true"
          ? true
          : activos === "false"
            ? false
            : undefined;

    return this.service.listarPorBarberoAutenticado(req.tenant!.id, userId, { activos: activosBool });
  }

  // PATCH /barbero/servicios/:barberServiceId
  @Patch(":barberServiceId")
  actualizarMiServicio(
    @Req() req: RequestAutenticado,
    @Param("barberServiceId") barberServiceId: string,
    @Body() dto: ActualizarServicioBarberoDto,
  ) {
    const userId = req.user?.sub;
    if (!userId) throw new Error("JWT sin sub en req.user");

    return this.service.actualizarPorBarberoAutenticado(req.tenant!.id, userId, barberServiceId, dto);
  }
}