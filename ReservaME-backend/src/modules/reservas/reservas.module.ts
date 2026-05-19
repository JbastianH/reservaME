import { Module } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { PrismaModule } from 'src/config/prisma.module';
import { MailModule } from "../mail/mail.module";


@Module({
  imports: [PrismaModule, MailModule],
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}