import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenType, UserRole } from '@prisma/client';

import { PrismaService } from '../../config/prisma.service';
import { MailService } from '../mail/mail.service';
import { generarTokenSeguro, hashToken } from '../../common/utils/tokens.util';
import { CreateTenantDto } from './dto/crear-tenant.dto';
import { UpdateTenantDto } from './dto/actualizar-tenant.dto';

@Injectable()
export class SuperAdminTenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async crear(dto: CreateTenantDto) {
    const domain = this.normalizarDominio(dto.domain);
    const adminEmail = dto.adminEmail.trim().toLowerCase();
    const tenantEmail = adminEmail;

    const existeDomain = await this.prisma.tenant.findUnique({
      where: { domain },
      select: { id: true },
    });

    if (existeDomain) {
      throw new BadRequestException('Ya existe una barbería con ese dominio.');
    }

    const existeAdmin = await this.prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });

    if (existeAdmin) {
      throw new BadRequestException(
        'Ya existe un usuario con ese correo admin.',
      );
    }

    const ttlMin = Number(
      this.config.get('ACTIVATION_TOKEN_TTL_MINUTES') ?? 60,
    );

    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);
    const tokenPlano = generarTokenSeguro(32);
    const tokenHash = hashToken(tokenPlano);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name.trim(),
          domain,
          email: tenantEmail,
          address: dto.address?.trim() ?? null,
          isActive: dto.isActive ?? true,
          settings: {
            create: {
              primaryColor: dto.primaryColor ?? '#000000',
              secondaryColor: dto.secondaryColor ?? '#FFFFFF',
              headerColor: dto.headerColor ?? '#000000',
              footerColor: dto.footerColor ?? '#000000',
              fontFamily: dto.fontFamily?.trim() ?? 'Inter',
            },
          },
        },
        select: {
          id: true,
          name: true,
          domain: true,
          email: true,
          address: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          settings: true,
        },
      });

      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash: null,
          role: UserRole.ADMIN,
          isActive: false,
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          tenantId: true,
        },
      });

      await tx.token.create({
        data: {
          tenantId: tenant.id,
          type: TokenType.ACTIVACION_CUENTA,
          tokenHash,
          userId: admin.id,
          expiresAt,
        },
      });

      return { tenant, admin };
    });

    const link = `${this.getFrontendUrlForDomain(domain)}/activate/${encodeURIComponent(
      tokenPlano,
    )}`;

    await this.mail.enviarActivacionCuenta({
      to: result.admin.email,
      nombre: result.tenant.name,
      link,
    });

    return {
      ok: true,
      mensaje: 'Barbería creada y correo de activación enviado al admin.',
      tenant: result.tenant,
      admin: result.admin,
    };
  }

  async listar() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        domain: true,
        email: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
        users: {
          where: { role: UserRole.ADMIN },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
          take: 1,
        },
      },
    });
  }

  async obtenerPorId(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        domain: true,
        email: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
        users: {
          where: { role: UserRole.ADMIN },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Barbería no encontrada.');
    }

    return tenant;
  }

  async actualizar(id: string, dto: UpdateTenantDto) {
    await this.obtenerPorId(id);

    const domain = dto.domain ? this.normalizarDominio(dto.domain) : undefined;

    if (domain) {
      const existeDomain = await this.prisma.tenant.findFirst({
        where: {
          domain,
          id: { not: id },
        },
        select: { id: true },
      });

      if (existeDomain) {
        throw new BadRequestException(
          'Ya existe una barbería con ese dominio.',
        );
      }
    }

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        domain,
        address:
          dto.address === undefined ? undefined : (dto.address?.trim() ?? null),
        isActive: dto.isActive,
        settings: {
          upsert: {
            create: {
              primaryColor: dto.primaryColor ?? '#000000',
              secondaryColor: dto.secondaryColor ?? '#FFFFFF',
              headerColor: dto.headerColor ?? '#000000',
              footerColor: dto.footerColor ?? '#000000',
              fontFamily: dto.fontFamily?.trim() ?? 'Inter',
            },
            update: {
              primaryColor: dto.primaryColor,
              secondaryColor: dto.secondaryColor,
              headerColor: dto.headerColor,
              footerColor: dto.footerColor,
              fontFamily: dto.fontFamily?.trim(),
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        domain: true,
        email: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
      },
    });

    return { ok: true, tenant };
  }

  async activar(id: string) {
    await this.obtenerPorId(id);

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: true },
    });

    return { ok: true, tenant };
  }

  async desactivar(id: string) {
    await this.obtenerPorId(id);

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });

    return { ok: true, tenant };
  }

  async reenviarActivacion(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        domain: true,
        users: {
          where: { role: UserRole.ADMIN },
          select: {
            id: true,
            email: true,
            isActive: true,
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Barbería no encontrada.');
    }

    const admin = tenant.users[0];

    if (!admin) {
      throw new BadRequestException(
        'La barbería no tiene usuario admin asociado.',
      );
    }

    if (admin.isActive) {
      throw new BadRequestException(
        'El usuario admin ya tiene su cuenta activa.',
      );
    }

    if (!tenant.domain) {
      throw new BadRequestException(
        'La barbería no tiene un dominio configurado.',
      );
    }

    const ttlMin = Number(
      this.config.get('ACTIVATION_TOKEN_TTL_MINUTES') ?? 60,
    );

    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);
    const tokenPlano = generarTokenSeguro(32);
    const tokenHash = hashToken(tokenPlano);

    await this.prisma.$transaction(async (tx) => {
      await tx.token.updateMany({
        where: {
          tenantId: tenant.id,
          userId: admin.id,
          type: TokenType.ACTIVACION_CUENTA,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.token.create({
        data: {
          tenantId: tenant.id,
          userId: admin.id,
          type: TokenType.ACTIVACION_CUENTA,
          tokenHash,
          expiresAt,
        },
      });
    });

    const link = `${this.getFrontendUrlForDomain(tenant.domain)}/activate/${encodeURIComponent(
      tokenPlano,
    )}`;

    await this.mail.enviarActivacionCuenta({
      to: admin.email,
      nombre: tenant.name,
      link,
    });

    return {
      ok: true,
      mensaje: 'Correo de activación reenviado correctamente.',
    };
  }

  private normalizarDominio(domain: string) {
    return domain
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '')
      .split(':')[0]
      .toLowerCase();
  }

  private getFrontendUrlForDomain(domain: string) {
    if (domain.endsWith('.localhost') || domain === 'localhost') {
      return `http://${domain}:3001`;
    }

    return `https://${domain}`;
  }
}
