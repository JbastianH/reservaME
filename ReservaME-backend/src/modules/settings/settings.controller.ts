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

type UpdateSettingsDto = {
  reminderHoursBefore: number;
  cancellationHoursBefore: number;
};

@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Auth('ADMIN')
  @Get()
  async get(@Req() req: RequestAutenticado) {
    const tenantId = req.tenant!.id;

    const existente = await this.prisma.appSetting.findUnique({
      where: { tenantId },
    });

    if (existente) {
      return { ok: true, settings: existente };
    }

    try {
      const settings = await this.prisma.appSetting.create({
        data: {
          tenantId,
          reminderHoursBefore: 24,
          cancellationHoursBefore: 3,
        },
      });

      return { ok: true, settings };
    } catch {
      const settings = await this.prisma.appSetting.findUnique({
        where: { tenantId },
      });

      if (!settings) {
        throw new BadRequestException('No se pudo cargar la configuración.');
      }

      return { ok: true, settings };
    }
  }

  @Auth('ADMIN')
  @Patch()
  async update(@Req() req: RequestAutenticado, @Body() dto: UpdateSettingsDto) {
    const reminderHours = Number(dto.reminderHoursBefore);
    const cancellationHours = Number(dto.cancellationHoursBefore);

    if (
      !Number.isFinite(reminderHours) ||
      reminderHours < 1 ||
      reminderHours > 168
    ) {
      throw new BadRequestException(
        'reminderHoursBefore inválido. Debe estar entre 1 y 168 horas.',
      );
    }

    if (
      !Number.isFinite(cancellationHours) ||
      cancellationHours < 1 ||
      cancellationHours > 168
    ) {
      throw new BadRequestException(
        'cancellationHoursBefore inválido. Debe estar entre 1 y 168 horas.',
      );
    }

    const settings = await this.prisma.appSetting.upsert({
      where: { tenantId: req.tenant!.id },
      update: {
        reminderHoursBefore: reminderHours,
        cancellationHoursBefore: cancellationHours,
      },
      create: {
        tenantId: req.tenant!.id,
        reminderHoursBefore: reminderHours,
        cancellationHoursBefore: cancellationHours,
      },
    });

    return { ok: true, settings };
  }
}
