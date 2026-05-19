import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { BarbersController } from "./barbers.controller";
import { BarbersService } from "./barbers.service";
import { ReservasModule } from "../reservas/reservas.module";
import { BarberoMeController } from "./barbero-me.controller";

@Module({
  imports: [PrismaModule, ReservasModule],
  controllers: [BarbersController, BarberoMeController],
  providers: [BarbersService],
})
export class BarbersModule {}