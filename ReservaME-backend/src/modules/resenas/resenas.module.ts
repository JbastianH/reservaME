import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { ResenasController } from "./resenas.controller";
import { ResenasService } from "./resenas.service";
import { BarberoResenasController } from "./barbero-resenas.controller";

@Module({
  imports: [PrismaModule],
  controllers: [ResenasController, BarberoResenasController],
  providers: [ResenasService],
})
export class ResenasModule {}