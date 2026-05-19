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
import { Request } from 'express';
import { Auth } from '../../common/decorators/auth.decorator';
import { ResenasService } from './resenas.service';
import { CrearResenaPublicaDto } from './dto/crear-resena-publica.dto';
import { ListarResenasQueryDto } from './dto/listar-resenas.query.dto';

type RequestAutenticado = Request & {
  user: { id: string; role: 'ADMIN' | 'BARBERO' };
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
  listarAdmin(@Query() query: ListarResenasQueryDto) {
    return this.service.listarAdmin(query);
  }

  // BARBERO: listar solo las propias
  @Auth('BARBERO')
  @Get('barbero/resenas')
  listarBarbero(
    @Req() req: RequestAutenticado,
    @Query() query: ListarResenasQueryDto,
  ) {
    return this.service.listarBarbero(req.user!.id, query);
  }

  // ADMIN: ocultar / mostrar
  @Auth('ADMIN')
  @Patch('admin/resenas/:id/ocultar')
  ocultarAdmin(@Param('id') id: string) {
    return this.service.setVisibleComoAdmin(id, false);
  }

  @Auth('ADMIN')
  @Patch('admin/resenas/:id/mostrar')
  mostrarAdmin(@Param('id') id: string) {
    return this.service.setVisibleComoAdmin(id, true);
  }

  // BARBERO: ocultar / mostrar sus propias reseñas
  @Auth('BARBERO')
  @Patch('barbero/resenas/:id/ocultar')
  ocultarBarbero(@Req() req: RequestAutenticado, @Param('id') id: string) {
    return this.service.setVisibleComoBarbero(req.user!.id, id, false);
  }

  @Auth('BARBERO')
  @Patch('barbero/resenas/:id/mostrar')
  mostrarBarbero(@Req() req: RequestAutenticado, @Param('id') id: string) {
    return this.service.setVisibleComoBarbero(req.user!.id, id, true);
  }
}
