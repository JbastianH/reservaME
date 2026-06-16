import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import type { TenantRequest } from '../../common/tenant/tenant-request.interface';
import { Auth } from '../../common/decorators/auth.decorator';
import { AdminTenantService } from './admin-tenant.service';
import { ActualizarAdminTenantDto } from './dto/actualizar-admin-tenant.dto';

type RequestAutenticado = TenantRequest &
  Request & {
    user?: {
      id?: string;
      sub?: string;
      tenantId?: string | null;
      role?: string;
      email?: string;
    };
  };

@Controller('admin/tenant')
export class AdminTenantController {
  constructor(private readonly adminTenantService: AdminTenantService) {}

  @Auth('ADMIN')
  @Get('configuracion')
  obtenerConfiguracion(@Req() req: RequestAutenticado) {
    const tenantId = this.obtenerTenantIdDesdeRequest(req);

    return this.adminTenantService.obtenerConfiguracion(tenantId);
  }

  @Auth('ADMIN')
  @Patch('configuracion')
  actualizarConfiguracion(
    @Req() req: RequestAutenticado,
    @Body() dto: ActualizarAdminTenantDto,
  ) {
    const tenantId = this.obtenerTenantIdDesdeRequest(req);

    return this.adminTenantService.actualizarConfiguracion(tenantId, dto);
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
