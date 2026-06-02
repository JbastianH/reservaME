import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class TenantResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveByHost(hostRaw?: string) {
    const host = this.normalizarHost(hostRaw);

    if (!host) {
      throw new NotFoundException('No se pudo identificar el dominio.');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        domain: host,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        domain: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant no encontrado para dominio: ${host}`);
    }

    return tenant;
  }

  private normalizarHost(hostRaw?: string) {
    if (!hostRaw) return undefined;

    try {
      const url = hostRaw.startsWith('http') ? new URL(hostRaw) : null;
      const host = url ? url.host : hostRaw;

      return host.split(':')[0]?.replace(/^www\./, '').toLowerCase();
    } catch {
      return hostRaw.split(':')[0]?.replace(/^www\./, '').toLowerCase();
    }
  }
}