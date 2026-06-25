import { Module } from '@nestjs/common';
import { TenantPublicoController } from './tenant-publico.controller';
import { TenantPublicoService } from './tenant-publico.service';

@Module({
  controllers: [TenantPublicoController],
  providers: [TenantPublicoService],
})
export class TenantPublicoModule {}