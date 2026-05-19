
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ResenasPublicasService } from "./resenas-publicas.service";
import { CrearResenaPublicaDto } from "./dto/crear-resena-publica.dto";

@Controller("public/resenas")
export class ResenasPublicasController {
  constructor(private readonly service: ResenasPublicasService) {}

  @Throttle({ default: { limit: 20, ttl: 60 } })
  @Get(":token")
  obtenerPorToken(@Param("token") token: string) {
    return this.service.obtenerPorToken(token);
  }

  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post(":token")
  crear(@Param("token") token: string, @Body() dto: CrearResenaPublicaDto) {
    return this.service.crearConToken(token, dto);
  }
}