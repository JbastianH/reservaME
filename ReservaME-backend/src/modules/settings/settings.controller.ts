import {
  Body,
  Controller,
  Get,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { Auth } from '../../common/decorators/auth.decorator';

@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Auth('ADMIN')
  @Get()
  async get() {
    const settings = await this.prisma.appSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, reminderHoursBefore: 24 },
    });

    return { ok: true, settings };
  }

  @Auth('ADMIN')
  @Patch()
  async update(@Body() dto: { reminderHoursBefore: number }) {
    const h = Number(dto.reminderHoursBefore);

    // Se valida rango razonable (1h a 168h = 7 días)
    if (!Number.isFinite(h) || h < 1 || h > 168) {
      throw new BadRequestException('reminderHoursBefore inválido (1..168).');
    }

    const settings = await this.prisma.appSetting.upsert({
      where: { id: 1 },
      update: { reminderHoursBefore: dto.reminderHoursBefore },
      create: { id: 1, reminderHoursBefore: 24 },
    });

    return { ok: true, settings };
  }
}
