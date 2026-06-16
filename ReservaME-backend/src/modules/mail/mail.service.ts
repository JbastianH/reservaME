import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  construirPoliticaCancelacionTexto,
  POLITICA_CANCELACION_HORAS_DEFAULT,
  POLITICA_CANCELACION_TITULO,
} from 'src/common/constants/politica-cancelacion';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.getOrThrow<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  private formatInChile(date: Date) {
    return new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  }

  private async obtenerHorasPoliticaCancelacion(tenantId?: string | null) {
    if (!tenantId) {
      return POLITICA_CANCELACION_HORAS_DEFAULT;
    }

    const settings = await this.prisma.appSetting.findUnique({
      where: {
        tenantId,
      },
      select: {
        cancellationHoursBefore: true,
      },
    });

    return (
      settings?.cancellationHoursBefore ?? POLITICA_CANCELACION_HORAS_DEFAULT
    );
  }

  private construirPoliticaCancelacionHtml(horas: number) {
    return `
    <p style="margin: 10px 0 0; font-size: 12px; color:#6b7280;">
      <strong>${this.escapeHtml(POLITICA_CANCELACION_TITULO)}:</strong>
      ${this.escapeHtml(construirPoliticaCancelacionTexto(horas))}
    </p>
  `;
  }

  async enviarActivacionCuenta(params: {
    to: string;
    link: string;
    nombre: string;
  }) {
    const subject = 'Activa tu cuenta - ReservaME';

    const LOGO_URL =
      'https://res.cloudinary.com/dllykgnb0/image/upload/v1780457196/Logo_ReservaME_sin_fondo_oltrvn.png';
    const NOMBRE_MARCA = 'ReservaME';
    const html = `
      <div style="margin:0;padding:0;background:#f3f4f6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            
            <tr>
              <td style="padding:18px 20px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
                <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                  <tr>
                    <td width="40" style="font-size:0;line-height:0;">&nbsp;</td>

                    <td align="left" style="vertical-align:middle;">
                      <div style="font-family:Arial,sans-serif;">
                        <div style="font-size:14px;color:#111827;font-weight:700;line-height:1;">
                          ${this.escapeHtml(NOMBRE_MARCA)}
                        </div>
                        <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                          Activación de cuenta
                        </div>
                      </div>
                    </td>

                    <td width="40" align="right" style="vertical-align:middle;">
                      ${
                        LOGO_URL
                          ? `<img src="${LOGO_URL}" alt="${this.escapeHtml(NOMBRE_MARCA)}" width="150" height="" style="display:block;border-radius:10px;" />`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:20px;font-family:Arial,sans-serif;color:#111827;">
                <h2 style="margin:0 0 10px;font-size:20px;line-height:1.2;">¡Bienvenido!</h2>

                <p style="margin:0 0 10px;color:#374151;">
                  Hola, <strong>${this.escapeHtml(params.nombre)}</strong>.
                </p>

                <p style="margin:0 0 10px;color:#374151;">
                  Estás a un paso de acceder a tu cuenta en <strong>${this.escapeHtml(NOMBRE_MARCA)}</strong>.
                </p>
                
                <p style="margin:0;color:#374151;">
                  Para crear tu contraseña y activar tu acceso, por favor utiliza el botón de abajo.
                </p>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin-top:14px;">
            <tr>
              <td align="center" style="padding:0 6px;">
                <a href="${params.link}"
                  style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;">
                  Activar Cuenta
                </a>

                <p style="margin:14px 0 0;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;">
                  Si tú no solicitaste esto, puedes ignorar este mensaje.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
    `;

    await this.sendEmail({ to: params.to, subject, html });
  }

  async enviarResena(params: { to: string; link: string; nombre: string }) {
    const subject = 'Tu opinión nos ayuda - ReservaME';
    const LOGO_URL =
      'https://res.cloudinary.com/dllykgnb0/image/upload/v1780457196/Logo_ReservaME_sin_fondo_oltrvn.png';
    const NOMBRE_MARCA = 'ReservaME';

    const html = `
      <div style="margin:0;padding:0;background:#f3f4f6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            
            <tr>
              <td style="padding:18px 20px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
                <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                  <tr>
                    <td width="40" style="font-size:0;line-height:0;">&nbsp;</td>

                    <td align="left" style="vertical-align:middle;">
                      <div style="font-family:Arial,sans-serif;">
                        <div style="font-size:14px;color:#111827;font-weight:700;line-height:1;">
                          ${this.escapeHtml(NOMBRE_MARCA)}
                        </div>
                        <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                          Tu opinión nos importa
                        </div>
                      </div>
                    </td>

                    <td width="40" align="right" style="vertical-align:middle;">
                      ${
                        LOGO_URL
                          ? `<img src="${LOGO_URL}" alt="${this.escapeHtml(NOMBRE_MARCA)}" width="150" height="" style="display:block;border-radius:10px;" />`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:20px;font-family:Arial,sans-serif;color:#111827;">
                <h2 style="margin:0 0 10px;font-size:20px;line-height:1.2;">¡Gracias por tu visita!</h2>

                <p style="margin:0 0 10px;color:#374151;">
                  Hola, <strong>${this.escapeHtml(params.nombre)}</strong>.
                </p>

                <p style="margin:0;color:#374151;">
                  Esperamos que hayas disfrutado tu servicio. ¿Podrías dejarnos una breve reseña? 
                </p>
                <p style="margin:6px 0 0;color:#374151;">
                  Solo te tomará menos de 1 minuto y nos ayuda muchísimo.
                </p>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin-top:14px;">
            <tr>
              <td align="center" style="padding:0 6px;">
                <a href="${params.link}"
                  style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;">
                  Dejar Reseña ⭐
                </a>

                <p style="margin:14px 0 0;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;">
                  Si tú no solicitaste esto, puedes ignorar este mensaje.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
    `;

    await this.sendEmail({ to: params.to, subject, html });
  }

  async enviarResumenReservaConGestion(params: {
    to: string;
    nombre: string;
    tenantId?: string | null;
    resumen: {
      barberName: string;
      serviceName: string;
      startAt: Date;
      endAt: Date;
      priceFinal: string;
      durationFinalMin: number;
      comment?: string | null;
    };
    linkGestion: string;
  }) {
    const subject = 'Tu reserva está confirmada - ReservaME';

    const start = this.formatInChile(params.resumen.startAt);
    const end = this.formatInChile(params.resumen.endAt);

    const commentSafe =
      params.resumen.comment && params.resumen.comment.trim()
        ? this.escapeHtml(params.resumen.comment.trim())
        : null;

    const LOGO_URL =
      'https://res.cloudinary.com/dllykgnb0/image/upload/v1780457196/Logo_ReservaME_sin_fondo_oltrvn.png';
    const NOMBRE_MARCA = 'ReservaME';

    const cancellationHoursBefore = await this.obtenerHorasPoliticaCancelacion(
      params.tenantId,
    );

    const politicaHtml = this.construirPoliticaCancelacionHtml(
      cancellationHoursBefore,
    );

    const html = `
  <div style="margin:0;padding:0;background:#f3f4f6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            
            <tr>
              <td style="padding:18px 20px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
                <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                  <tr>
                    <td width="40" style="font-size:0;line-height:0;">&nbsp;</td>

                    <td align="left" style="vertical-align:middle;">
                      <div style="font-family:Arial,sans-serif;">
                        <div style="font-size:14px;color:#111827;font-weight:700;line-height:1;">
                          ${this.escapeHtml(NOMBRE_MARCA)}
                        </div>
                        <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                          Confirmación de reserva
                        </div>
                      </div>
                    </td>

                    <td width="40" align="right" style="vertical-align:middle;">
                      ${
                        LOGO_URL
                          ? `<img src="${LOGO_URL}" alt="${this.escapeHtml(NOMBRE_MARCA)}" width="150" height="" style="display:block;border-radius:10px;" />`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px;font-family:Arial,sans-serif;color:#111827;">
                <h2 style="margin:0 0 10px;font-size:20px;line-height:1.2;">¡Reserva confirmada!</h2>

                <p style="margin:0 0 10px;color:#374151;">
                  Hola, <strong>${this.escapeHtml(params.nombre)}</strong>.
                </p>

                <p style="margin:0 0 14px;color:#374151;">
                  Tu reserva fue confirmada. Aquí tienes el resumen:
                </p>

                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
                  <p style="margin:0 0 6px;"><strong>Barbero:</strong> ${this.escapeHtml(params.resumen.barberName)}</p>
                  <p style="margin:0 0 6px;"><strong>Servicio:</strong> ${this.escapeHtml(params.resumen.serviceName)}</p>
                  <p style="margin:0 0 6px;"><strong>Inicio:</strong> ${this.escapeHtml(start)} (Chile)</p>
                  <p style="margin:0 0 6px;"><strong>Término:</strong> ${this.escapeHtml(end)} (Chile)</p>
                  <p style="margin:0 0 6px;"><strong>Duración:</strong> ${params.resumen.durationFinalMin} min</p>
                  <p style="margin:0;"><strong>Precio:</strong> $ ${this.escapeHtml(params.resumen.priceFinal)}</p>

                  ${
                    commentSafe
                      ? `<p style="margin:10px 0 0;color:#374151;"><strong>Comentario:</strong> ${commentSafe}</p>`
                      : ''
                  }
                </div>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin-top:14px;">
            <tr>
              <td style="font-family:Arial,sans-serif;color:#374151;padding:0 6px 10px;">
                <p style="margin:0;">
                  Si necesitas <strong>cancelar</strong> o <strong>reprogramar</strong>, usa este enlace:
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 6px;">
                <a href="${params.linkGestion}"
                  style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;">
                  Gestionar mi reserva
                </a>

                ${politicaHtml}

                <p style="margin:14px 0 0;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;">
                  Si tú no hiciste esta reserva, puedes ignorar este mensaje.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
  `;

    await this.sendEmail({ to: params.to, subject, html });
  }

  async enviarReservaReprogramadaConGestion(params: {
    to: string;
    nombre: string;
    tenantId?: string | null;
    resumen: {
      barberName: string;
      serviceName: string;
      startAt: Date;
      endAt: Date;
      priceFinal: string;
      durationFinalMin: number;
      comment?: string | null;
    };
    linkGestion: string;
  }) {
    const subject = 'Tu reserva fue reprogramada - ReservaME';

    const start = this.formatInChile(params.resumen.startAt);
    const end = this.formatInChile(params.resumen.endAt);

    const commentSafe =
      params.resumen.comment && params.resumen.comment.trim()
        ? this.escapeHtml(params.resumen.comment.trim())
        : null;

    const LOGO_URL =
      'https://res.cloudinary.com/dllykgnb0/image/upload/v1780457196/Logo_ReservaME_sin_fondo_oltrvn.png';
    const NOMBRE_MARCA = 'ReservaME';

    const cancellationHoursBefore = await this.obtenerHorasPoliticaCancelacion(
      params.tenantId,
    );

    const politicaHtml = this.construirPoliticaCancelacionHtml(
      cancellationHoursBefore,
    );
    const html = `
    <div style="margin:0;padding:0;background:#f3f4f6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            
            <tr>
              <td style="padding:18px 20px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
                <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                  <tr>
                    <td width="40" style="font-size:0;line-height:0;">&nbsp;</td>

                    <td align="left" style="vertical-align:middle;">
                      <div style="font-family:Arial,sans-serif;">
                        <div style="font-size:14px;color:#111827;font-weight:700;line-height:1;">
                          ${this.escapeHtml(NOMBRE_MARCA)}
                        </div>
                        <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                          Reserva reprogramada
                        </div>
                      </div>
                    </td>

                    <td width="40" align="right" style="vertical-align:middle;">
                      ${
                        LOGO_URL
                          ? `<img src="${LOGO_URL}" alt="${this.escapeHtml(NOMBRE_MARCA)}" width="150" height="" style="display:block;border-radius:10px;" />`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:20px;font-family:Arial,sans-serif;color:#111827;">
                <h2 style="margin:0 0 10px;font-size:20px;line-height:1.2;">¡Reserva reprogramada!</h2>

                <p style="margin:0 0 10px;color:#374151;">
                  Hola, <strong>${this.escapeHtml(params.nombre)}</strong>.
                </p>

                <p style="margin:0 0 14px;color:#374151;">
                  Tu reserva fue <strong>reprogramada</strong>. Aquí tienes el nuevo resumen:
                </p>

                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
                  <p style="margin:0 0 6px;"><strong>Barbero:</strong> ${this.escapeHtml(params.resumen.barberName)}</p>
                  <p style="margin:0 0 6px;"><strong>Servicio:</strong> ${this.escapeHtml(params.resumen.serviceName)}</p>
                  <p style="margin:0 0 6px;"><strong>Inicio:</strong> ${this.escapeHtml(start)}</p>
                  <p style="margin:0 0 6px;"><strong>Término:</strong> ${this.escapeHtml(end)}</p>
                  <p style="margin:0 0 6px;"><strong>Duración:</strong> ${params.resumen.durationFinalMin} min</p>
                  <p style="margin:0;"><strong>Precio:</strong> $ ${this.escapeHtml(params.resumen.priceFinal)}</p>

                  ${
                    commentSafe
                      ? `<p style="margin:10px 0 0;color:#374151;"><strong>Comentario:</strong> ${commentSafe}</p>`
                      : ''
                  }
                </div>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin-top:14px;">
            <tr>
              <td style="font-family:Arial,sans-serif;color:#374151;padding:0 6px 10px;">
                <p style="margin:0;">
                  Si necesitas <strong>cancelar</strong> o <strong>reprogramar</strong> nuevamente:
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 6px;">
                <a href="${params.linkGestion}"
                  style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;">
                  Gestionar mi reserva
                </a>

                ${politicaHtml}

                <p style="margin:14px 0 0;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;">
                  Si tú no hiciste esta acción, puedes ignorar este mensaje.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
  `;

    await this.sendEmail({ to: params.to, subject, html });
  }

  async enviarRecordatorioReservaConGestion(params: {
    to: string;
    nombre: string;
    tenantId?: string | null;
    hoursBefore: number; // ej: 24
    resumen: {
      barberName: string;
      serviceName: string;
      startAt: Date;
      endAt: Date;
      priceFinal: string;
      durationFinalMin: number;
      comment?: string | null;
    };
    linkGestion: string;
  }) {
    const subject = `Recordatorio de tu reserva - ReservaME`;

    const start = this.formatInChile(params.resumen.startAt);
    const end = this.formatInChile(params.resumen.endAt);

    const commentSafe =
      params.resumen.comment && params.resumen.comment.trim()
        ? this.escapeHtml(params.resumen.comment.trim())
        : null;

    const cuando =
      params.hoursBefore === 24
        ? 'mañana'
        : `en aproximadamente ${params.hoursBefore} horas`;

    const LOGO_URL =
      'https://res.cloudinary.com/dllykgnb0/image/upload/v1780457196/Logo_ReservaME_sin_fondo_oltrvn.png';
    const NOMBRE_MARCA = 'ReservaME';

    const cancellationHoursBefore = await this.obtenerHorasPoliticaCancelacion(
      params.tenantId,
    );

    const politicaHtml = this.construirPoliticaCancelacionHtml(
      cancellationHoursBefore,
    );

    const html = `
    <div style="margin:0;padding:0;background:#f3f4f6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            
            <tr>
              <td style="padding:18px 20px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
                <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                  <tr>
                    <td width="40" style="font-size:0;line-height:0;">&nbsp;</td>

                    <td align="left" style="vertical-align:middle;">
                      <div style="font-family:Arial,sans-serif;">
                        <div style="font-size:14px;color:#111827;font-weight:700;line-height:1;">
                          ${this.escapeHtml(NOMBRE_MARCA)}
                        </div>
                        <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                          Recordatorio de reserva
                        </div>
                      </div>
                    </td>

                    <td width="40" align="right" style="vertical-align:middle;">
                      ${
                        LOGO_URL
                          ? `<img src="${LOGO_URL}" alt="${this.escapeHtml(NOMBRE_MARCA)}" width="150" height="" style="display:block;border-radius:10px;" />`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:20px;font-family:Arial,sans-serif;color:#111827;">
                <h2 style="margin:0 0 10px;font-size:20px;line-height:1.2;">¡No olvides tu reserva!</h2>

                <p style="margin:0 0 10px;color:#374151;">
                  Hola, <strong>${this.escapeHtml(params.nombre)}</strong>.
                </p>

                <p style="margin:0 0 14px;color:#374151;">
                  Te recordamos que tienes una reserva <strong>${this.escapeHtml(cuando)}</strong>. Aquí tienes el resumen:
                </p>

                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px;">
                  <p style="margin:0 0 6px;"><strong>Barbero:</strong> ${this.escapeHtml(params.resumen.barberName)}</p>
                  <p style="margin:0 0 6px;"><strong>Servicio:</strong> ${this.escapeHtml(params.resumen.serviceName)}</p>
                  <p style="margin:0 0 6px;"><strong>Inicio:</strong> ${this.escapeHtml(start)} (Chile)</p>
                  <p style="margin:0 0 6px;"><strong>Término:</strong> ${this.escapeHtml(end)} (Chile)</p>
                  <p style="margin:0 0 6px;"><strong>Duración:</strong> ${params.resumen.durationFinalMin} min</p>
                  <p style="margin:0;"><strong>Precio:</strong> $ ${this.escapeHtml(params.resumen.priceFinal)}</p>

                  ${
                    commentSafe
                      ? `<p style="margin:10px 0 0;color:#374151;"><strong>Comentario:</strong> ${commentSafe}</p>`
                      : ''
                  }
                </div>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin-top:14px;">
            <tr>
              <td style="font-family:Arial,sans-serif;color:#374151;padding:0 6px 10px;">
                <p style="margin:0;">
                  Si necesitas <strong>cancelar</strong> o <strong>reprogramar</strong>, usa este enlace:
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 6px;">
                <a href="${params.linkGestion}"
                  style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;">
                  Gestionar mi reserva
                </a>

                ${politicaHtml}

                <p style="margin:14px 0 0;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;">
                  Si tú no hiciste esta reserva, puedes ignorar este mensaje.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
  `;

    await this.sendEmail({ to: params.to, subject, html });
  }

  async enviarRecuperacionPassword(params: {
    to: string;
    link: string;
    nombre: string;
  }) {
    const subject = 'Restablecer contraseña - ReservaME';

    const LOGO_URL =
      'https://res.cloudinary.com/dllykgnb0/image/upload/v1780457196/Logo_ReservaME_sin_fondo_oltrvn.png';
    const NOMBRE_MARCA = 'ReservaME';
    const html = `
      <div style="margin:0;padding:0;background:#f3f4f6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            
            <tr>
              <td style="padding:18px 20px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
                <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                  <tr>
                    <td width="40" style="font-size:0;line-height:0;">&nbsp;</td>

                    <td align="left" style="vertical-align:middle;">
                      <div style="font-family:Arial,sans-serif;">
                        <div style="font-size:14px;color:#111827;font-weight:700;line-height:1;">
                          ${this.escapeHtml(NOMBRE_MARCA)}
                        </div>
                        <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                          Recuperación de acceso
                        </div>
                      </div>
                    </td>

                    <td width="40" align="right" style="vertical-align:middle;">
                      ${
                        LOGO_URL
                          ? `<img src="${LOGO_URL}" alt="${this.escapeHtml(NOMBRE_MARCA)}" width="150" height="" style="display:block;border-radius:10px;" />`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:20px;font-family:Arial,sans-serif;color:#111827;">
                <h2 style="margin:0 0 10px;font-size:20px;line-height:1.2;">¿Olvidaste tu contraseña?</h2>

                <p style="margin:0 0 10px;color:#374151;">
                  Hola, <strong>${this.escapeHtml(params.nombre)}</strong>.
                </p>

                <p style="margin:0 0 10px;color:#374151;">
                  Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>${this.escapeHtml(NOMBRE_MARCA)}</strong>.
                </p>
                
                <p style="margin:0;color:#374151;">
                  Para elegir una nueva contraseña y recuperar tu acceso, por favor utiliza el botón de abajo. 
                </p>
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin-top:14px;">
            <tr>
              <td align="center" style="padding:0 6px;">
                <a href="${params.link}"
                  style="display:inline-block;padding:12px 18px;border-radius:12px;background:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;">
                  Restablecer Contraseña
                </a>

                <p style="margin:14px 0 0;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;">
                  Si tú no solicitaste este cambio, puedes ignorar este mensaje de forma segura. Tu contraseña seguirá siendo la misma.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
    `;

    await this.sendEmail({ to: params.to, subject, html });
  }

  /**
   * Método único para enviar correos (respeta MAIL_FORCE_TO para modo testing).
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }) {
    const from = this.config.getOrThrow<string>('EMAIL_FROM');
    const forceTo = this.config.get<string>('MAIL_FORCE_TO');
    const toFinal = forceTo ?? params.to;

    const { error } = await this.resend.emails.send({
      from,
      to: [toFinal],
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      this.logger.error(`Error Resend: ${JSON.stringify(error)}`);
      throw new Error('No se pudo enviar el correo.');
    }
  }

  /**
   * Se escapan caracteres básicos para evitar HTML injection en correos.
   */
  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
