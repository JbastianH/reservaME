import { Module } from "@nestjs/common";
import { PrismaModule } from "../../config/prisma.module";
import { BarberosPublicosController } from "./barberos-publicos.controller";
import { BarberosPublicosService } from "./barberos-publicos.service";

@Module({
  imports: [PrismaModule],
  controllers: [BarberosPublicosController],
  providers: [BarberosPublicosService],
})
export class BarberosPublicosModule {}