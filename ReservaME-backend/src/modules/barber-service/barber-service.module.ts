import { Module } from "@nestjs/common";
import { BarberServicesController } from "./barber-service.controller";
import { BarberServicesService } from "./barber-service.service";
import { PrismaModule } from "../../config/prisma.module";
import { BarberoBarberServiciosController } from "./barbero-barber-servicios.controller";


@Module({
  imports: [PrismaModule],
  controllers: [BarberServicesController, BarberoBarberServiciosController],
  providers: [BarberServicesService],
})
export class BarberServicesModule {}