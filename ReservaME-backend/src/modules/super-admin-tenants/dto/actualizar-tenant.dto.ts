import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantDto } from './crear-tenant.dto';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}