import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReservasPublicasService } from './reservas-publicas.service';
import { CrearReservaPublicaDto } from './dto/crear-reserva-publica.dto';
import type { TenantRequest } from '../../common/tenant/tenant-request.interface';

@Controller('public/reservas')
export class ReservasPublicasController {
  constructor(private readonly service: ReservasPublicasService) {}

  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post()
  crear(@Req() req: TenantRequest, @Body() dto: CrearReservaPublicaDto) {
    return this.service.crear(req.tenant!.id, dto);
  }

  // Obtener resumen por token de gestión para la página pública.
  @Get('gestion/:token')
  obtenerGestion(@Param('token') token: string) {
    return this.service.obtenerGestionPorToken({ token });
  }

  // Token por URL. Calza con /reserva/gestionar/:token.
  @Post('gestion/:token/cancelar')
  cancelar(@Param('token') token: string) {
    return this.service.cancelarConToken({ token });
  }

  @Post('gestion/:token/reprogramar')
  reprogramar(
    @Param('token') token: string,
    @Body() body: { startAt: string },
  ) {
    return this.service.reprogramarConToken({ token, startAt: body.startAt });
  }

  @Get(':id')
  obtenerResumen(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.service.obtenerResumenPublico(req.tenant!.id, id);
  }
}