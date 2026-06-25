import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { TenantRequest } from '../../common/tenant/tenant-request.interface';
import { Auth } from '../../common/decorators/auth.decorator';
import { ResenasService } from './resenas.service';
import { CrearResenaPublicaDto } from './dto/crear-resena-publica.dto';
import { ListarResenasQueryDto } from './dto/listar-resenas.query.dto';

type RequestAutenticado = TenantRequest & Request & {
  user: { id: string; sub?: string; role: 'SUPER_ADMIN' | 'ADMIN' | 'BARBERO' };
};

@Controller()
export class ResenasController {
  constructor(private readonly service: ResenasService) {}

  // Público: crear reseña usando token
  @Post('public/resenas')
  crearPublica(@Body() dto: CrearResenaPublicaDto) {
    return this.service.crearPublica(dto);
  }

  // ADMIN: listar todas
  @Auth('ADMIN')
  @Get('admin/resenas')
  listarAdmin(@Req() req: RequestAutenticado, @Query() query: ListarResenasQueryDto) {
    return this.service.listarAdmin(req.tenant!.id, query);
  }

  // BARBERO: listar solo las propias
  @Auth('BARBERO')
  @Get('barbero/resenas')
  listarBarbero(
    @Req() req: RequestAutenticado,
    @Query() query: ListarResenasQueryDto,
  ) {
    const userId = req.user!.sub ?? req.user!.id;
    return this.service.listarBarbero(req.tenant!.id, userId, query);
  }

  // ADMIN: ocultar / mostrar
  @Auth('ADMIN')
  @Patch('admin/resenas/:id/ocultar')
  ocultarAdmin(@Req() req: RequestAutenticado, @Param('id') id: string) {
    return this.service.setVisibleComoAdmin(req.tenant!.id, id, false);
  }

  @Auth('ADMIN')
  @Patch('admin/resenas/:id/mostrar')
  mostrarAdmin(@Req() req: RequestAutenticado, @Param('id') id: string) {
    return this.service.setVisibleComoAdmin(req.tenant!.id, id, true);
  }

  // BARBERO: ocultar / mostrar sus propias reseñas
  @Auth('BARBERO')
  @Patch('barbero/resenas/:id/ocultar')
  ocultarBarbero(@Req() req: RequestAutenticado, @Param('id') id: string) {
    const userId = req.user!.sub ?? req.user!.id;
    return this.service.setVisibleComoBarbero(req.tenant!.id, userId, id, false);
  }

  @Auth('BARBERO')
  @Patch('barbero/resenas/:id/mostrar')
  mostrarBarbero(@Req() req: RequestAutenticado, @Param('id') id: string) {
    const userId = req.user!.sub ?? req.user!.id;
    return this.service.setVisibleComoBarbero(req.tenant!.id, userId, id, true);
  }
}
