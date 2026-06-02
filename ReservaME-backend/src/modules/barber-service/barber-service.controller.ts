import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';

import { Auth } from '../../common/decorators/auth.decorator';
import { BarberServicesService } from './barber-service.service';
import { AsignarServicioBarberoDto } from './dto/asignar-servicio-barbero.dto';
import { ActualizarServicioBarberoDto } from './dto/actualizar-servicio-barbero.dto';
import type { TenantRequest } from '../../common/tenant/tenant-request.interface';

@Auth('ADMIN')
@Controller('admin/barberos/:barberId/servicios')
export class BarberServicesController {
  constructor(private readonly service: BarberServicesService) {}

  @Post()
  asignar(
    @Req() req: TenantRequest,
    @Param('barberId') barberId: string,
    @Body() dto: AsignarServicioBarberoDto,
  ) {
    return this.service.asignar(req.tenant!.id, barberId, dto);
  }

  @Get()
  listar(
    @Req() req: TenantRequest,
    @Param('barberId') barberId: string,
  ) {
    return this.service.listarPorBarbero(req.tenant!.id, barberId);
  }

  @Patch(':barberServiceId')
  actualizar(
    @Req() req: TenantRequest,
    @Param('barberId') barberId: string,
    @Param('barberServiceId') barberServiceId: string,
    @Body() dto: ActualizarServicioBarberoDto,
  ) {
    return this.service.actualizar(
      req.tenant!.id,
      barberId,
      barberServiceId,
      dto,
    );
  }

  @Patch(':barberServiceId/desactivar')
  desactivar(
    @Req() req: TenantRequest,
    @Param('barberId') barberId: string,
    @Param('barberServiceId') barberServiceId: string,
  ) {
    return this.service.cambiarActivo(
      req.tenant!.id,
      barberId,
      barberServiceId,
      false,
    );
  }

  @Patch(':barberServiceId/activar')
  activar(
    @Req() req: TenantRequest,
    @Param('barberId') barberId: string,
    @Param('barberServiceId') barberServiceId: string,
  ) {
    return this.service.cambiarActivo(
      req.tenant!.id,
      barberId,
      barberServiceId,
      true,
    );
  }
}