import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { Auth } from '../../common/decorators/auth.decorator';
import { CreateTenantDto } from './dto/crear-tenant.dto';
import { UpdateTenantDto } from './dto/actualizar-tenant.dto';
import { SuperAdminTenantsService } from './super-admin-tenants.service';

@Auth('SUPER_ADMIN')
@Controller('super-admin/tenants')
export class SuperAdminTenantsController {
  constructor(private readonly service: SuperAdminTenantsService) {}

  @Post()
  crear(@Body() dto: CreateTenantDto) {
    return this.service.crear(dto);
  }

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.service.obtenerPorId(id);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.service.actualizar(id, dto);
  }

  @Patch(':id/activar')
  activar(@Param('id') id: string) {
    return this.service.activar(id);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id') id: string) {
    return this.service.desactivar(id);
  }

  @Post(':id/reenviar-activacion')
  reenviarActivacion(@Param('id') id: string) {
    return this.service.reenviarActivacion(id);
  }
}
