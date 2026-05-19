import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { MailService } from '../mail/mail.service';
import { generarTokenSeguro, hashToken } from '../../common/utils/tokens.util';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private async getReminderHours(): Promise<number> {
    // Se asegura que exista una fila de settings con valores por defecto.
    // No debe pisar el valor configurado por admin.
    const s = await this.prisma.appSetting.upsert({
      where: { id: 1 },
      update: {}, //no sobrescribe
      create: { id: 1, reminderHoursBefore: 24 },
      select: { reminderHoursBefore: true },
    });

    const h = Number(s.reminderHoursBefore);
    return Number.isFinite(h) && h > 0 ? h : 24;
  }

  private getFrontendUrl(): string {
    return (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
  }

  private async generarLinkGestion(
    tx: Prisma.TransactionClient,
    reservationId: string,
  ) {
    const ttlMin = Number(
      this.config.get('RESERVATION_MANAGEMENT_TOKEN_TTL_MINUTES') ?? 1440,
    );
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    const tokenPlano = generarTokenSeguro(32);
    const tokenHash = hashToken(tokenPlano);

    // Se invalidan tokens anteriores no usados para esa reserva.
    await tx.token.updateMany({
      where: {
        reservationId,
        type: 'GESTION_RESERVA',
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    await tx.token.create({
      data: {
        type: 'GESTION_RESERVA',
        tokenHash,
        reservationId,
        expiresAt,
      },
    });

    const linkGestion = `${this.getFrontendUrl()}/reserva/gestionar/${tokenPlano}`;
    return { linkGestion, expiresAt };
  }


  @Cron('*/10 * * * *') // Ejecutar cada 10 minutos
  async run() {
    const hours = await this.getReminderHours();

    const now = new Date();
    const target = new Date(now.getTime() + hours * 60 * 60 * 1000);

    // Ventana de 20 min (±5) para no depender del minuto exacto.
    const windowStart = new Date(target.getTime() - 10 * 60 * 1000);
    const windowEnd = new Date(target.getTime() + 10 * 60 * 1000);

    const reservas = await this.prisma.reservation.findMany({
      where: {
        status: 'CONFIRMADA',
        reminderSentAt: null,
        startAt: { gte: windowStart, lt: windowEnd },
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        clientName: true,
        clientEmail: true,
        comment: true,
        priceFinal: true,
        durationFinalMin: true,
        barber: { select: { name: true } },
        service: { select: { name: true } },
      },
      take: 200,
    });

    if (reservas.length === 0) return;

    this.logger.log(`Recordatorios: ${reservas.length} (hours=${hours})`);

    for (const r of reservas) {
      try {
        // Se hace transacción por reserva para evitar duplicados si corre en paralelo.
        await this.prisma.$transaction(async (tx) => {
          // Se vuelve a verificar que siga pendiente (antirace).
          const fresh = await tx.reservation.findUnique({
            where: { id: r.id },
            select: { reminderSentAt: true, status: true },
          });

          if (!fresh || fresh.status !== 'CONFIRMADA' || fresh.reminderSentAt)
            return;

          const { linkGestion } = await this.generarLinkGestion(tx, r.id);

          await this.mail.enviarRecordatorioReservaConGestion({
            to: r.clientEmail,
            nombre: r.clientName,
            hoursBefore: hours,
            resumen: {
              barberName: r.barber?.name ?? '—',
              serviceName: r.service?.name ?? '—',
              startAt: r.startAt,
              endAt: r.endAt,
              priceFinal: r.priceFinal.toString(),
              durationFinalMin: r.durationFinalMin,
              comment: r.comment ?? null,
            },
            linkGestion,
          });

          await tx.reservation.update({
            where: { id: r.id },
            data: { reminderSentAt: new Date() },
          });
        });
      } catch (e: any) {
        this.logger.error(
          `Error recordatorio reserva ${r.id}: ${e?.message ?? String(e)}`,
        );
      }
    }
  }
}
