import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { Auth } from "../../common/decorators/auth.decorator";
import { BarbersService } from "./barbers.service";
import { CrearBarberoDto } from "./dto/crear-barbero.dto";
import { ActualizarBarberoDto } from "./dto/actualizar-barbero.dto";
import { ListarBarberosDto } from "./dto/listar-barberos.dto";
import type { TenantRequest } from "../../common/tenant/tenant-request.interface";

@Auth("ADMIN")
@Controller("admin/barberos")
export class BarbersController {
  constructor(private readonly service: BarbersService) {}

  @Post()
  crear(@Req() req: TenantRequest, @Body() dto: CrearBarberoDto) {
    return this.service.crear(req.tenant!.id, dto);
  }

  @Get()
  listar(@Req() req: TenantRequest, @Query() query: ListarBarberosDto) {
    return this.service.listar(req.tenant!.id, query);
  }

  @Get(":id")
  obtener(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.service.obtenerPorId(req.tenant!.id, id);
  }

  @Patch(":id")
  actualizar(
    @Req() req: TenantRequest,
    @Param("id") id: string,
    @Body() dto: ActualizarBarberoDto,
  ) {
    return this.service.actualizar(req.tenant!.id, id, dto);
  }

  @Patch(":id/desactivar")
  desactivar(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.service.desactivar(req.tenant!.id, id);
  }

  @Patch(":id/activar")
  activar(@Req() req: TenantRequest, @Param("id") id: string) {
    return this.service.activar(req.tenant!.id, id);
  }
}