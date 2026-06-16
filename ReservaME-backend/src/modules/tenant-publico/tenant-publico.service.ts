import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class TenantPublicoService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerTenantPublico(tenantId?: string) {
    if (!tenantId) {
      throw new BadRequestException('No se pudo identificar la barbería.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        settings: true,
      },
    });

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Barbería no encontrada o inactiva.');
    }

    const appSettings = await this.prisma.appSetting.findUnique({
      where: {
        tenantId: tenant.id,
      },
      select: {
        cancellationHoursBefore: true
      },
    });

    return {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      email: tenant.email,
      address: tenant.address,
      instagramUrl: tenant.instagramUrl,
      settings: {
        logoUrl: tenant.settings?.logoUrl ?? null,
        heroImageUrl: tenant.settings?.heroImageUrl ?? null,
        primaryColor: tenant.settings?.primaryColor ?? '#111827',
        secondaryColor: tenant.settings?.secondaryColor ?? '#F59E0B',
        headerColor: tenant.settings?.headerColor ?? '#111827',
        footerColor: tenant.settings?.footerColor ?? '#111827',
        fontFamily: tenant.settings?.fontFamily ?? 'Inter',
        cancellationHoursBefore: appSettings?.cancellationHoursBefore ?? 3,
      },
    };
  }
}
