import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { Auth } from '../../common/decorators/auth.decorator';

@Controller()
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  // =========================
  // PUBLICO
  // =========================
  @Get('public/servicios')
  listarPublico() {
    return this.serviciosService.listarPublico();
  }

  @Get('public/servicios/:id')
  obtenerPublico(@Param('id') id: string) {
    return this.serviciosService.obtenerPorId(id);
  }

  // =========================
  // ADMIN
  // =========================
  @Auth('ADMIN')
  @Post('admin/servicios')
  crear(@Body() dto: CreateServicioDto) {
    return this.serviciosService.crear(dto);
  }

  @Auth('ADMIN')
  @Get('admin/servicios')
  listarAdmin() {
    return this.serviciosService.listar();
  }

  @Auth('ADMIN')
  @Get('admin/servicios/:id')
  obtenerAdmin(@Param('id') id: string) {
    return this.serviciosService.obtenerPorId(id);
  }

  @Auth('ADMIN')
  @Patch('admin/servicios/:id')
  actualizar(@Param('id') id: string, @Body() dto: UpdateServicioDto) {
    return this.serviciosService.actualizar(id, dto);
  }

  // “Eliminar” = desactivar (tu service hace isActive=false)
  @Auth('ADMIN')
  @Patch('admin/servicios/:id/desactivar')
  eliminar(@Param('id') id: string) {
    return this.serviciosService.desactivar(id);
  }

  @Auth('ADMIN')
  @Patch('admin/servicios/:id/activar')
  activar(@Param('id') id: string) {
    return this.serviciosService.activar(id);
  }
}
