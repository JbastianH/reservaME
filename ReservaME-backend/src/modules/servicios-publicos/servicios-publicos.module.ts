import { Module } from "@nestjs/common";
import { ServiciosPublicosController } from "./servicios-publicos.controller";
import { ServiciosService } from "../servicios/servicios.service";
import { PrismaModule } from "../../config/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ServiciosPublicosController],
  providers: [ServiciosService],
})
export class ServiciosPublicosModule {}