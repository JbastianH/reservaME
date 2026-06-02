import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';

import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { Auth } from '../../common/decorators/auth.decorator';
import type { TenantRequest } from '../../common/tenant/tenant-request.interface';

@Controller()
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  // =========================
  // PUBLICO
  // =========================
  @Get('public/servicios')
  listarPublico(@Req() req: TenantRequest) {
    return this.serviciosService.listarPublico(req.tenant!.id);
  }

  @Get('public/servicios/:id')
  obtenerPublico(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.serviciosService.obtenerPorId(req.tenant!.id, id);
  }

  // =========================
  // ADMIN
  // =========================
  @Auth('ADMIN')
  @Post('admin/servicios')
  crear(@Req() req: TenantRequest, @Body() dto: CreateServicioDto) {
    return this.serviciosService.crear(req.tenant!.id, dto);
  }

  @Auth('ADMIN')
  @Get('admin/servicios')
  listarAdmin(@Req() req: TenantRequest) {
    return this.serviciosService.listar(req.tenant!.id);
  }

  @Auth('ADMIN')
  @Get('admin/servicios/:id')
  obtenerAdmin(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.serviciosService.obtenerPorId(req.tenant!.id, id);
  }

  @Auth('ADMIN')
  @Patch('admin/servicios/:id')
  actualizar(
    @Req() req: TenantRequest,
    @Param('id') id: string,
    @Body() dto: UpdateServicioDto,
  ) {
    return this.serviciosService.actualizar(req.tenant!.id, id, dto);
  }

  @Auth('ADMIN')
  @Patch('admin/servicios/:id/desactivar')
  eliminar(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.serviciosService.desactivar(req.tenant!.id, id);
  }

  @Auth('ADMIN')
  @Patch('admin/servicios/:id/activar')
  activar(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.serviciosService.activar(req.tenant!.id, id);
  }
}