import { Module } from "@nestjs/common";
import { ReservasPublicasController } from "./reservas-publicas.controller";
import { ReservasPublicasService } from "./reservas-publicas.service";
import { PrismaModule } from "../../config/prisma.module";
import { MailModule } from "../mail/mail.module";


@Module({
  imports: [
    PrismaModule, // acceso a la base de datos
    MailModule,
  ],
  controllers: [
    ReservasPublicasController,
  ],
  providers: [
    ReservasPublicasService,
  ],
})
export class ReservasPublicasModule {}