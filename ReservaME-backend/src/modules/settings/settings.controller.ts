import {
  Body,
  Controller,
  Get,
  Patch,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { TenantRequest } from '../../common/tenant/tenant-request.interface';
import { PrismaService } from '../../config/prisma.service';
import { Auth } from '../../common/decorators/auth.decorator';

type RequestAutenticado = TenantRequest & Request;

@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Auth('ADMIN')
  @Get()
  async get(@Req() req: RequestAutenticado) {
    const settings = await this.prisma.appSetting.upsert({
      where: { tenantId: req.tenant!.id },
      update: {},
      create: {
        tenantId: req.tenant!.id,
        reminderHoursBefore: 24,
      },
    });

    return { ok: true, settings };
  }

  @Auth('ADMIN')
  @Patch()
  async update(
    @Req() req: RequestAutenticado,
    @Body() dto: { reminderHoursBefore: number },
  ) {
    const h = Number(dto.reminderHoursBefore);

    // Se valida rango razonable (1h a 168h = 7 días)
    if (!Number.isFinite(h) || h < 1 || h > 168) {
      throw new BadRequestException('reminderHoursBefore inválido (1..168).');
    }

    const settings = await this.prisma.appSetting.upsert({
      where: { tenantId: req.tenant!.id },
      update: { reminderHoursBefore: dto.reminderHoursBefore },
      create: {
        tenantId: req.tenant!.id,
        reminderHoursBefore: dto.reminderHoursBefore,
      },
    });

    return { ok: true, settings };
  }
}
