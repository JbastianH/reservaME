import { Module } from "@nestjs/common";
import { PrismaService } from "../../config/prisma.service";
import { PortafolioBarberoController } from "./portafolio-barbero.controller";
import { PortafolioService } from "./portafolio.service";
import { PortafolioAdminController } from "./portafolio-admin.controller";

@Module({
  controllers: [PortafolioBarberoController, PortafolioAdminController],
  providers: [PortafolioService, PrismaService],
  exports: [PortafolioService],
})
export class PortafolioModule {}