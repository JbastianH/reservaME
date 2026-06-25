import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../config/prisma.service';
import { ActualizarAdminTenantDto } from './dto/actualizar-admin-tenant.dto';

@Injectable()
export class AdminTenantService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerConfiguracion(tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        isActive: true,
      },
      include: {
        settings: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Barbería no encontrada o inactiva.');
    }

    return {
      ok: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        email: tenant.email,
        address: tenant.address,
        instagramUrl: tenant.instagramUrl,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        settings: {
          id: tenant.settings?.id ?? null,
          tenantId: tenant.id,
          logoUrl: tenant.settings?.logoUrl ?? null,
          heroImageUrl: tenant.settings?.heroImageUrl ?? null,
          primaryColor: tenant.settings?.primaryColor ?? '#000000',
          secondaryColor: tenant.settings?.secondaryColor ?? '#FFFFFF',
          headerColor: tenant.settings?.headerColor ?? '#000000',
          footerColor: tenant.settings?.footerColor ?? '#000000',
          fontFamily: tenant.settings?.fontFamily ?? 'Inter',
          createdAt: tenant.settings?.createdAt ?? null,
          updatedAt: tenant.settings?.updatedAt ?? null,
        },
      },
    };
  }

  async actualizarConfiguracion(
    tenantId: string,
    dto: ActualizarAdminTenantDto,
  ) {
    const existeTenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!existeTenant) {
      throw new NotFoundException('Barbería no encontrada o inactiva.');
    }

    const name = this.normalizarTextoOpcional(dto.name);

    if (dto.name !== undefined && !name) {
      throw new BadRequestException('El nombre de la barbería es obligatorio.');
    }

    const tenant = await this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        name: dto.name === undefined ? undefined : name!,
        address:
          dto.address === undefined
            ? undefined
            : this.normalizarTextoOpcional(dto.address),
        instagramUrl:
          dto.instagramUrl === undefined
            ? undefined
            : this.normalizarTextoOpcional(dto.instagramUrl),

        settings: {
          upsert: {
            create: {
              logoUrl: this.normalizarTextoOpcional(dto.logoUrl),
              heroImageUrl: this.normalizarTextoOpcional(dto.heroImageUrl),
              primaryColor:
                this.normalizarTextoOpcional(dto.primaryColor) ?? '#000000',
              secondaryColor:
                this.normalizarTextoOpcional(dto.secondaryColor) ?? '#FFFFFF',
              headerColor:
                this.normalizarTextoOpcional(dto.headerColor) ?? '#000000',
              footerColor:
                this.normalizarTextoOpcional(dto.footerColor) ?? '#000000',
              fontFamily:
                this.normalizarTextoOpcional(dto.fontFamily) ?? 'Inter',
            },
            update: {
              logoUrl:
                dto.logoUrl === undefined
                  ? undefined
                  : this.normalizarTextoOpcional(dto.logoUrl),
              heroImageUrl:
                dto.heroImageUrl === undefined
                  ? undefined
                  : this.normalizarTextoOpcional(dto.heroImageUrl),
              primaryColor:
                dto.primaryColor === undefined
                  ? undefined
                  : this.normalizarTextoOpcional(dto.primaryColor),
              secondaryColor:
                dto.secondaryColor === undefined
                  ? undefined
                  : this.normalizarTextoOpcional(dto.secondaryColor),
              headerColor:
                dto.headerColor === undefined
                  ? undefined
                  : this.normalizarTextoOpcional(dto.headerColor),
              footerColor:
                dto.footerColor === undefined
                  ? undefined
                  : this.normalizarTextoOpcional(dto.footerColor),
              fontFamily:
                dto.fontFamily === undefined
                  ? undefined
                  : this.normalizarTextoOpcional(dto.fontFamily),
            },
          },
        },
      },
      include: {
        settings: true,
      },
    });

    return {
      ok: true,
      mensaje: 'Configuración actualizada correctamente.',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        email: tenant.email,
        address: tenant.address,
        instagramUrl: tenant.instagramUrl,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        settings: tenant.settings,
      },
    };
  }

  private normalizarTextoOpcional(valor?: string | null) {
    const limpio = valor?.trim();

    if (!limpio) return null;

    return limpio;
  }
}
