import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReservasService } from './reservas.service';
import { ListarReservasQueryDto } from './dto/listar-reservas.query.dto';
import { Auth } from '../../common/decorators/auth.decorator';
import { ReprogramarReservaDto } from './dto/reprogramar-reserva.dto';
import { AdminDashboardQueryDto } from './dto/admin-dashboard.query.dto';
import type { TenantRequest } from '../../common/tenant/tenant-request.interface';

type RequestAutenticado = TenantRequest & Request & {
  user?: { sub: string; role: 'ADMIN' | 'BARBERO' };
};

@Controller()
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  // ADMIN: KPIs dashboard
  @Auth('ADMIN')
  @Get('admin/reservas/kpis')
  kpisAdmin(
    @Req() req: RequestAutenticado,
    @Query() query: AdminDashboardQueryDto,
  ) {
    return this.reservasService.kpisAdmin(req.tenant!.id, query);
  }

  // ADMIN: listar reservas (todas o por barberId)
  @Auth('ADMIN')
  @Get('admin/reservas')
  listarAdmin(
    @Req() req: RequestAutenticado,
    @Query() query: ListarReservasQueryDto,
  ) {
    return this.reservasService.listarParaAdmin(req.tenant!.id, query);
  }

  // BARBERO: listar MIS reservas
  @Auth('BARBERO')
  @Get('barbero/reservas')
  listarBarbero(
    @Req() req: RequestAutenticado,
    @Query() query: ListarReservasQueryDto,
  ) {
    const userId = req.user!.sub;
    return this.reservasService.listarParaBarbero(
      req.tenant!.id,
      userId,
      query,
    );
  }

  // ADMIN: completar una reserva por id
  @Auth('ADMIN')
  @Patch('admin/reservas/:id/completar')
  completarAdmin(@Req() req: RequestAutenticado, @Param('id') id: string) {
    return this.reservasService.completarComoAdmin(req.tenant!.id, id);
  }

  // BARBERO: completar una reserva propia por id
  @Auth('BARBERO')
  @Patch('barbero/reservas/:id/completar')
  completarBarbero(@Req() req: RequestAutenticado, @Param('id') id: string) {
    const userId = req.user!.sub;
    return this.reservasService.completarComoBarbero(
      req.tenant!.id,
      userId,
      id,
    );
  }

  // ADMIN: cancelar reserva
  @Auth('ADMIN')
  @Patch('admin/reservas/:id/cancelar')
  cancelarAdmin(@Req() req: RequestAutenticado, @Param('id') id: string) {
    return this.reservasService.cancelarComoAdmin(req.tenant!.id, id);
  }

  // BARBERO: cancelar MIS reservas
  @Auth('BARBERO')
  @Patch('barbero/reservas/:id/cancelar')
  cancelarBarbero(@Req() req: RequestAutenticado, @Param('id') id: string) {
    return this.reservasService.cancelarComoBarbero(
      req.tenant!.id,
      req.user!.sub,
      id,
    );
  }

  @Auth('BARBERO')
  @Patch('barbero/reservas/:id/reprogramar')
  reprogramarComoBarbero(
    @Req() req: RequestAutenticado,
    @Param('id') id: string,
    @Body() dto: ReprogramarReservaDto,
  ) {
    return this.reservasService.reprogramarComoBarbero(
      req.tenant!.id,
      req.user!.sub,
      id,
      dto.startAt,
    );
  }

  @Auth('ADMIN')
  @Patch('admin/reservas/:id/reprogramar')
  reprogramarComoAdmin(
    @Req() req: RequestAutenticado,
    @Param('id') id: string,
    @Body() dto: ReprogramarReservaDto,
  ) {
    return this.reservasService.reprogramarComoAdmin(
      req.tenant!.id,
      id,
      dto.startAt,
    );
  }
}
