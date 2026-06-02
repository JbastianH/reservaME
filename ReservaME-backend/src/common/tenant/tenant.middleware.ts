import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { TenantResolverService } from './tenant-resolver.service';
import type { TenantRequest } from './tenant-request.interface';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantResolver: TenantResolverService) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    const tenantHostHeader = req.headers['x-tenant-host'];
    const tenantHost = Array.isArray(tenantHostHeader)
      ? tenantHostHeader[0]
      : tenantHostHeader;

    const origin = req.headers.origin;
    const host = tenantHost ?? origin ?? req.headers.host;

    const tenant = await this.tenantResolver.resolveByHost(host);
    req.tenant = tenant;
    next();
  }
}