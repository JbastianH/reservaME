import { Module } from '@nestjs/common';
import { SuperAdminTenantsService } from './super-admin-tenants.service';
import { SuperAdminTenantsController } from './super-admin-tenants.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [SuperAdminTenantsController],
  providers: [SuperAdminTenantsService],
})
export class SuperAdminTenantsModule {}