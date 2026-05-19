import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  Body,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { ListarReservasQueryDto } from './dto/listar-reservas.query.dto';
import { Auth } from '../../common/decorators/auth.decorator';
import { Request } from 'express';
import { ReprogramarReservaDto } from './dto/reprogramar-reserva.dto';
import { AdminDashboardQueryDto } from './dto/admin-dashboard.query.dto';

type RequestAutenticado = Request & {
  user?: { sub: string; role: 'ADMIN' | 'BARBERO' };
};

@Controller()
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  // ADMIN: KPIs dashboard
  @Auth('ADMIN')
  @Get('admin/reservas/kpis')
  kpisAdmin(@Query() query: AdminDashboardQueryDto) {
    return this.reservasService.kpisAdmin(query);
  }
  // ADMIN: listar reservas (todas o por barberId)
  @Auth('ADMIN')
  @Get('admin/reservas')
  listarAdmin(@Query() query: ListarReservasQueryDto) {
    return this.reservasService.listarParaAdmin(query);
  }

  // BARBERO: listar MIS reservas
  @Auth('BARBERO')
  @Get('barbero/reservas')
  listarBarbero(
    @Req() req: RequestAutenticado,
    @Query() query: ListarReservasQueryDto,
  ) {
    const userId = req.user!.sub;
    return this.reservasService.listarParaBarbero(userId, query);
  }

  // ADMIN: completar una reserva por id
  @Auth('ADMIN')
  @Patch('admin/reservas/:id/completar')
  completarAdmin(@Param('id') id: string) {
    return this.reservasService.completarComoAdmin(id);
  }

  // BARBERO: completar una reserva propia por id
  @Auth('BARBERO')
  @Patch('barbero/reservas/:id/completar')
  completarBarbero(@Req() req: RequestAutenticado, @Param('id') id: string) {
    const userId = req.user!.sub;
    return this.reservasService.completarComoBarbero(userId, id);
  }

  // ADMIN: cancelar reserva
  @Auth('ADMIN')
  @Patch('admin/reservas/:id/cancelar')
  cancelarAdmin(@Param('id') id: string) {
    return this.reservasService.cancelarComoAdmin(id);
  }

  // BARBERO: cancelar MIS reservas
  @Auth('BARBERO')
  @Patch('barbero/reservas/:id/cancelar')
  cancelarBarbero(@Req() req: RequestAutenticado, @Param('id') id: string) {
    return this.reservasService.cancelarComoBarbero(req.user!.sub, id);
  }

  @Auth('BARBERO')
  @Patch('barbero/reservas/:id/reprogramar')
  reprogramarComoBarbero(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReprogramarReservaDto,
  ) {
    return this.reservasService.reprogramarComoBarbero(
      req.user!.sub,
      id,
      dto.startAt,
    );
  }

  @Auth('ADMIN')
  @Patch('admin/reservas/:id/reprogramar')
  reprogramarComoAdmin(
    @Param('id') id: string,
    @Body() dto: ReprogramarReservaDto,
  ) {
    return this.reservasService.reprogramarComoAdmin(id, dto.startAt);
  }
}
