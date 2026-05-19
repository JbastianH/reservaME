import { Module } from "@nestjs/common";
import { DisponibilidadPublicaController } from "./disponibilidad-publica.controller";
import { DisponibilidadPublicaService } from "./disponibilidad-publica.service";
import { PrismaService } from "../../config/prisma.service";

@Module({
  controllers: [DisponibilidadPublicaController],
  providers: [DisponibilidadPublicaService, PrismaService],
})
export class DisponibilidadModule {}