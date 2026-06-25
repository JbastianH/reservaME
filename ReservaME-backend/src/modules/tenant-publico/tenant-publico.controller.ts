import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { TenantPublicoService } from './tenant-publico.service';

type RequestConTenant = Request & {
  tenant?: {
    id: string;
    name?: string;
    domain?: string;
  };
};

@Controller('public/tenant')
export class TenantPublicoController {
  constructor(private readonly service: TenantPublicoService) {}

  @Get()
  obtenerTenantPublico(@Req() req: RequestConTenant) {
    return this.service.obtenerTenantPublico(req.tenant?.id);
  }
}