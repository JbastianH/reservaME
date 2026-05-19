import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { Auth } from "../../common/decorators/auth.decorator";
import { BarberServicesService } from "./barber-service.service";
import { AsignarServicioBarberoDto } from "./dto/asignar-servicio-barbero.dto";
import { ActualizarServicioBarberoDto } from "./dto/actualizar-servicio-barbero.dto";

@Auth("ADMIN")
@Controller("admin/barberos/:barberId/servicios")
export class BarberServicesController {
  constructor(private readonly service: BarberServicesService) {}

  @Post()
  asignar(@Param("barberId") barberId: string, @Body() dto: AsignarServicioBarberoDto) {
    return this.service.asignar(barberId, dto);
  }

  @Get()
  listar(@Param("barberId") barberId: string) {
    return this.service.listarPorBarbero(barberId);
  }

  @Patch(":barberServiceId")
  actualizar(
    @Param("barberId") barberId: string,
    @Param("barberServiceId") barberServiceId: string,
    @Body() dto: ActualizarServicioBarberoDto,
  ) {
    return this.service.actualizar(barberId, barberServiceId, dto);
  }

  @Patch(":barberServiceId/desactivar")
  desactivar(@Param("barberId") barberId: string, @Param("barberServiceId") barberServiceId: string) {
    return this.service.cambiarActivo(barberId, barberServiceId, false);
  }

  @Patch(":barberServiceId/activar")
  activar(@Param("barberId") barberId: string, @Param("barberServiceId") barberServiceId: string) {
    return this.service.cambiarActivo(barberId, barberServiceId, true);
  }
}