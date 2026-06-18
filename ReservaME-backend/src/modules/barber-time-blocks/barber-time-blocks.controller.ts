import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Auth } from '../../common/decorators/auth.decorator';
import type { TenantRequest } from '../../common/tenant/tenant-request.interface';
import { BarberTimeBlocksService } from './barber-time-blocks.service';
import { CrearBarberTimeBlockDto } from './dto/crear-barber-time-block.dto';
import { ListarBarberTimeBlocksQueryDto } from './dto/listar-barber-time-blocks.query.dto';

type RequestAutenticado = TenantRequest &
  Request & {
    user?: {
      id?: string;
      sub?: string;
      role?: string;
      tenantId?: string | null;
      email?: string;
    };
  };

@Auth('ADMIN', 'BARBERO')
@Controller('barber-time-blocks')
export class BarberTimeBlocksController {
  constructor(
    private readonly barberTimeBlocksService: BarberTimeBlocksService,
  ) {}

  @Get()
  listar(
    @Req() req: RequestAutenticado,
    @Query() query: ListarBarberTimeBlocksQueryDto,
  ) {
    const tenantId = this.obtenerTenantIdDesdeRequest(req);

    return this.barberTimeBlocksService.listar(tenantId, req.user, query);
  }

  @Post()
  crear(@Req() req: RequestAutenticado, @Body() dto: CrearBarberTimeBlockDto) {
    const tenantId = this.obtenerTenantIdDesdeRequest(req);

    return this.barberTimeBlocksService.crear(tenantId, req.user, dto);
  }

  @Delete(':id')
  eliminar(@Req() req: RequestAutenticado, @Param('id') id: string) {
    const tenantId = this.obtenerTenantIdDesdeRequest(req);

    return this.barberTimeBlocksService.eliminar(tenantId, req.user, id);
  }

  private obtenerTenantIdDesdeRequest(req: RequestAutenticado) {
    const tenantId = req.tenant?.id ?? req.user?.tenantId;

    if (!tenantId) {
      throw new BadRequestException(
        'No se pudo identificar la barbería del usuario autenticado.',
      );
    }

    return tenantId;
  }
}
