import { Module } from "@nestjs/common";
import { HorarioBarberoController } from "./horario-barbero.controller";
import { HorarioBarberoService } from "./horario-barbero.service";

@Module({
  controllers: [HorarioBarberoController],
  providers: [HorarioBarberoService],
})
export class HorarioBarberoModule {}