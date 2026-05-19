import { Body, Controller, Post, Get, Param } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ReservasPublicasService } from "./reservas-publicas.service";
import { CrearReservaPublicaDto } from "./dto/crear-reserva-publica.dto";
import { GestionarReservaDto } from "./dto/gestionar-reserva.dto";
import { ReprogramarReservaDto } from "./dto/reprogramar-reserva.dto";

@Controller("public/reservas")
export class ReservasPublicasController {
  constructor(private readonly service: ReservasPublicasService) {}

  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post()
  crear(@Body() dto: CrearReservaPublicaDto) {
    return this.service.crear(dto);
  }

  // obtener resumen por token de gestión (para la página pública)
  @Get("gestion/:token")
  obtenerGestion(@Param("token") token: string) {
    return this.service.obtenerGestionPorToken({ token });
  }

  // token por URL (calza con /reserva/gestionar/:token)
  @Post("gestion/:token/cancelar")
  cancelar(@Param("token") token: string) {
    return this.service.cancelarConToken({ token });
  }

  @Post("gestion/:token/reprogramar")
  reprogramar(
    @Param("token") token: string,
    @Body() body: { startAt: string },
  ) {
    return this.service.reprogramarConToken({ token, startAt: body.startAt });
  }

  // (dejas tu GET por id tal cual)
  @Get(":id")
  obtenerResumen(@Param("id") id: string) {
    return this.service.obtenerResumenPublico(id);
  }
}