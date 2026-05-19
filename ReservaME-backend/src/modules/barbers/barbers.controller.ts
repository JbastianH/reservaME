import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Auth } from "../../common/decorators/auth.decorator";
import { BarbersService } from "./barbers.service";
import { CrearBarberoDto } from "./dto/crear-barbero.dto";
import { ActualizarBarberoDto } from "./dto/actualizar-barbero.dto";
import { ListarBarberosDto } from "./dto/listar-barberos.dto";

@Auth("ADMIN")
@Controller("admin/barberos")
export class BarbersController {
  constructor(private readonly service: BarbersService) {}

  @Post()
  crear(@Body() dto: CrearBarberoDto) {
    return this.service.crear(dto);
  }

  @Get()
  listar(@Query() query: ListarBarberosDto) {
    return this.service.listar(query);
  }

  @Get(":id")
  obtener(@Param("id") id: string) {
    return this.service.obtenerPorId(id);
  }

  @Patch(":id")
  actualizar(@Param("id") id: string, @Body() dto: ActualizarBarberoDto) {
    return this.service.actualizar(id, dto);
  }

  @Patch(":id/desactivar")
  desactivar(@Param("id") id: string) {
    return this.service.desactivar(id);
  }

  @Patch(":id/activar")
  activar(@Param("id") id: string) {
    return this.service.activar(id);
  }
}