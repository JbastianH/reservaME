import { Module } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { BarberTimeBlocksController } from './barber-time-blocks.controller';
import { BarberTimeBlocksService } from './barber-time-blocks.service';

@Module({
  controllers: [BarberTimeBlocksController],
  providers: [BarberTimeBlocksService, PrismaService],
})
export class BarberTimeBlocksModule {}
