import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard, seconds } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { PrismaModule } from "./config/prisma.module";
import { RolesGuard } from "./common/guards/roles.guard"
import { BarbersModule } from "./modules/barbers/barbers.module";
import { ServiciosModule } from './modules/servicios/servicios.module';
import { BarberServicesModule } from "./modules/barber-service/barber-service.module";
import { BarberosPublicosModule } from "./modules/barberos-publicos/barberos-publicos.module";
import { ReservasPublicasModule } from "./modules/reservas-publicas/reservas-publicas.module";
import { ReservasModule } from './modules/reservas/reservas.module';
import { ResenasPublicasModule } from './modules/resenas-publicas/resenas-publicas.module';
import { ResenasModule } from "./modules/resenas/resenas.module";
import { UsersModule } from "./modules/users/users.module";
import { MediaModule } from "./modules/media/media.module";
import { PortafolioModule } from "./modules/portafolio/portafolio.module";
import { DisponibilidadModule } from "./modules/disponibilidad/disponibilidad-publica.module";
import { HorarioBarberoModule } from "./modules/horarios/horario-barbero.module";
import { RemindersModule } from "./modules/reminders/reminders.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { ScheduleModule } from '@nestjs/schedule';
import { ProductosModule } from './modules/productos/productos.module';
import { TenantMiddleware } from "./common/tenant/tenant.middleware";
import { TenantResolverService } from "./common/tenant/tenant-resolver.service";
import { BarberosPublicosController } from "./modules/barberos-publicos/barberos-publicos.controller";
import { ServiciosController } from "./modules/servicios/servicios.controller";
import { BarberServicesController } from "./modules/barber-service/barber-service.controller";
import { ReservasPublicasController } from "./modules/reservas-publicas/reservas-publicas.controller";
import { BarberoBarberServiciosController } from "./modules/barber-service/barbero-barber-servicios.controller";
import { DisponibilidadPublicaController } from "./modules/disponibilidad/disponibilidad-publica.controller";
import { HorarioBarberoController } from "./modules/horarios/horario-barbero.controller";
import { PortafolioAdminController } from "./modules/portafolio/portafolio-admin.controller";
import { PortafolioBarberoController } from "./modules/portafolio/portafolio-barbero.controller";
import { ProductosController } from "./modules/productos/productos.controller";
import { ResenasController } from "./modules/resenas/resenas.controller";
import { BarberoResenasController } from "./modules/resenas/barbero-resenas.controller";
import { SettingsController } from "./modules/settings/settings.controller";
import { ServiciosPublicosController } from "./modules/servicios-publicos/servicios-publicos.controller";
import { BarbersController } from "./modules/barbers/barbers.controller";
import { BarberoMeController } from "./modules/barbers/barbero-me.controller";
import { ReservasController } from "./modules/reservas/reservas.controller";
import { SuperAdminTenantsModule } from "./modules/super-admin-tenants/super-admin-tenants.module";






@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: seconds(Number(config.get("RATE_LIMIT_TTL_SECONDS") ?? 60)),
            limit: Number(config.get("RATE_LIMIT_LIMIT") ?? 100),
          },
        ],
      }),
    }),

    PrismaModule,
    AuthModule,
    BarbersModule,
    ServiciosModule,
    BarberServicesModule,
    BarberosPublicosModule,
    ReservasPublicasModule,
    ReservasModule,
    ResenasPublicasModule,
    ResenasModule,
    UsersModule,
    MediaModule,
    PortafolioModule,
    DisponibilidadModule,
    HorarioBarberoModule,
    RemindersModule,
    SettingsModule,
    ScheduleModule.forRoot(),
    ProductosModule,
    SuperAdminTenantsModule,
  
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RolesGuard,
    TenantResolverService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes(
      BarberosPublicosController,
      ServiciosController,
      BarberServicesController,
      ReservasPublicasController,
      BarberoBarberServiciosController,
      DisponibilidadPublicaController,
      HorarioBarberoController,
      PortafolioAdminController,
      PortafolioBarberoController,
      ProductosController,
      ResenasController,
      BarberoResenasController,
      SettingsController,
      ServiciosPublicosController,
      BarbersController,
      BarberoMeController,
      "auth/login",
      "auth/admin/usuarios",
      "auth/admin/usuarios/reenviar-activacion",
      "auth/solicitar-recuperacion",
      ReservasController,
    );
  }

}