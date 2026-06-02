import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { BarberosPublicosService } from './barberos-publicos.service';
import type { TenantRequest } from '../../common/tenant/tenant-request.interface';

@Controller('public/barberos')
export class BarberosPublicosController {
  constructor(private readonly service: BarberosPublicosService) {}

  @Get()
  listar(@Req() req: TenantRequest, @Query('q') q?: string) {
    return this.service.listar(req.tenant!.id, q);
  }

  @Get(':slug')
  obtener(@Req() req: TenantRequest, @Param('slug') slug: string) {
    return this.service.obtenerPorSlug(req.tenant!.id, slug);
  }

  @Get(':slug/servicios')
  listarServicios(@Req() req: TenantRequest, @Param('slug') slug: string) {
    return this.service.listarServiciosPorSlug(req.tenant!.id, slug);
  }

  @Get(':slug/resenas')
  listarResenas(
    @Req() req: TenantRequest,
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ) {
    const take = Math.min(Math.max(Number(limit ?? 10) || 10, 1), 50);
    return this.service.listarResenasPorSlug(req.tenant!.id, slug, take);
  }
}