import { Module } from '@nestjs/common';

import { AdminTenantController } from './admin-tenant.controller';
import { AdminTenantService } from './admin-tenant.service';
import { PrismaService } from '../../config/prisma.service';

@Module({
  controllers: [AdminTenantController],
  providers: [AdminTenantService, PrismaService],
})
export class AdminTenantModule {}
