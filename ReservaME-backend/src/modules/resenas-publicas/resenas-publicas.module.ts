import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { ResenasPublicasController } from "./resenas-publicas.controller";
import { ResenasPublicasService } from "./resenas-publicas.service";

@Module({
  imports: [PrismaModule],
  controllers: [ResenasPublicasController],
  providers: [ResenasPublicasService],
})
export class ResenasPublicasModule {}