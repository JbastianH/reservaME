import { Controller, Get, Param, Query } from '@nestjs/common';
import { BarberosPublicosService } from './barberos-publicos.service';

@Controller('public/barberos')
export class BarberosPublicosController {
  constructor(private readonly service: BarberosPublicosService) {}

  @Get()
  listar(@Query('q') q?: string) {
    return this.service.listar(q);
  }

  @Get(':slug')
  obtener(@Param('slug') slug: string) {
    return this.service.obtenerPorSlug(slug);
  }

  @Get(':slug/servicios')
  listarServicios(@Param('slug') slug: string) {
    return this.service.listarServiciosPorSlug(slug);
  }

  @Get(':slug/resenas')
  listarResenas(@Param('slug') slug: string, @Query('limit') limit?: string) {
    const take = Math.min(Math.max(Number(limit ?? 10) || 10, 1), 50);
    return this.service.listarResenasPorSlug(slug, take);
  }
}
