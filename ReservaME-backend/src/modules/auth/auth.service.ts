import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../config/prisma.service';
import { verifyPassword, hashPassword } from '../../common/utils/password.util';
import { generarTokenSeguro, hashToken } from '../../common/utils/tokens.util';

import { LoginDto } from './dto/login.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActivarCuentaDto } from './dto/activar-cuenta.dto';
import { SolicitarRecuperacionDto } from './dto/solicitar-recuperacion.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}


  async login(tenantId: string, dto: LoginDto): Promise<{
    accessToken: string;
    role: UserRole;
    tenantId: string | null;
  }> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        tenantId: true,
        email: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas.');

    if (user.role !== 'SUPER_ADMIN' && user.tenantId !== tenantId) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    if (!user.isActive) throw new ForbiddenException('Cuenta no activada.');
    if (!user.passwordHash) {
      throw new ForbiddenException(
        'Cuenta sin contraseña. Debe activar la cuenta.',
      );
    }

    const ok = await verifyPassword(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas.');

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
      role: user.role,
      tenantId: user.tenantId,
    };
  }

  // Admin crea usuario sin contraseña + envía link de activación
  async crearUsuarioConActivacion(tenantId: string, dto: CrearUsuarioDto) {
    const email = dto.email.trim().toLowerCase();

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant no válido o inactivo.');
    }

    if (dto.role === 'SUPER_ADMIN') {
      throw new BadRequestException(
        'No se puede crear un SUPER_ADMIN desde este flujo.',
      );
    }

    if (dto.role === 'BARBERO') {
      if (!dto.name?.trim()) {
        throw new BadRequestException('Para BARBERO se requiere nombre.');
      }
      if (!dto.slug?.trim()) {
        throw new BadRequestException('Para BARBERO se requiere slug.');
      }
    }

    const existe = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existe) {
      throw new BadRequestException('Ya existe un usuario con ese correo.');
    }

    const ttlMin = Number(
      this.config.get('ACTIVATION_TOKEN_TTL_MINUTES') ?? 60,
    );
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    const tokenPlano = generarTokenSeguro(32);
    const tokenHash = hashToken(tokenPlano);

    const nombreParaCorreo = dto.name?.trim() || 'Nuevo Usuario';

    const resultado = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email,
          role: dto.role,
          isActive: false,
          passwordHash: null,
        },
        select: {
          id: true,
          tenantId: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (dto.role === 'BARBERO') {
        await tx.barber.create({
          data: {
            tenantId,
            userId: user.id,
            name: dto.name!.trim(),
            slug: dto.slug!.trim(),
            bio: dto.bio?.trim() ?? null,
            phone: dto.phone?.trim() ?? null,
            photoUrl: dto.photoUrl?.trim() ?? null,
            isActive: true,
          },
          select: { id: true },
        });
      }

      await tx.token.create({
        data: {
          tenantId,
          type: 'ACTIVACION_CUENTA',
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      });

      return { user };
    });

    const frontendUrl = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');

    const link = `${frontendUrl}/activate/${encodeURIComponent(tokenPlano)}`;

    await this.mail.enviarActivacionCuenta({
      to: resultado.user.email,
      link,
      nombre: nombreParaCorreo,
    });

    return {
      ok: true,
      mensaje: 'Usuario creado y correo de activación enviado.',
      user: resultado.user,
    };
  }

  async reenviarActivacion(tenantId: string, emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        isActive: true,
        barber: { select: { name: true } },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado.');
    if (user.isActive) {
      throw new BadRequestException('El usuario ya se encuentra activo.');
    }

    const ttlMin = Number(
      this.config.get('ACTIVATION_TOKEN_TTL_MINUTES') ?? 60,
    );
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    const tokenPlano = generarTokenSeguro(32);
    const tokenHash = hashToken(tokenPlano);

    await this.prisma.$transaction([
      this.prisma.token.updateMany({
        where: {
          tenantId,
          userId: user.id,
          type: 'ACTIVACION_CUENTA',
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
      this.prisma.token.create({
        data: {
          tenantId,
          type: 'ACTIVACION_CUENTA',
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      }),
    ]);

    const frontendUrl = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');

    const link = `${frontendUrl}/activate/${encodeURIComponent(tokenPlano)}`;
    const nombreParaCorreo = user.barber?.name || 'Usuario';

    await this.mail.enviarActivacionCuenta({
      to: user.email,
      link,
      nombre: nombreParaCorreo,
    });

    return { ok: true, mensaje: 'Se reenvió el correo de activación.' };
  }

  // Público activa cuenta (token + password)
  async activarCuenta(dto: ActivarCuentaDto) {
    const tokenHash = hashToken(dto.token.trim());

    const token = await this.prisma.token.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        type: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: {
          select: { id: true, email: true, isActive: true },
        },
      },
    });

    if (!token) throw new NotFoundException('Token inválido.');
    if (token.type !== 'ACTIVACION_CUENTA') {
      throw new BadRequestException('Token no válido para activación.');
    }
    if (!token.userId || !token.user) {
      throw new BadRequestException('Token inválido (sin usuario).');
    }
    if (token.usedAt) throw new BadRequestException('Token ya fue utilizado.');
    if (token.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Token expirado.');
    }

    const passwordHash = await hashPassword(dto.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: token.userId },
        data: {
          passwordHash,
          isActive: true,
        },
      }),
      this.prisma.token.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { ok: true, mensaje: 'Cuenta activada correctamente.' };
  }

  async solicitarRecuperacionPassword(
    tenantId: string,
    dto: SolicitarRecuperacionDto,
  ) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        isActive: true,
        barber: { select: { name: true } },
      },
    });

    if (!user) {
      return {
        ok: true,
        mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación.',
      };
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'La cuenta debe estar activa para restablecer la contraseña.',
      );
    }

    const tokenPlano = generarTokenSeguro(32);
    const tokenHash = hashToken(tokenPlano);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.token.create({
      data: {
        tenantId,
        type: 'RECUPERAR_PASSWORD',
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const frontendUrl = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');

    const link = `${frontendUrl}/login/reset-password/${encodeURIComponent(tokenPlano)}`;

    const nombreParaCorreo = user.barber?.name || 'Administrador';

    await this.mail.enviarRecuperacionPassword({
      to: user.email,
      link,
      nombre: nombreParaCorreo,
    });

    return {
      ok: true,
      mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación.',
    };
  }

  async resetearPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token.trim());

    const token = await this.prisma.token.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!token || token.type !== 'RECUPERAR_PASSWORD') {
      throw new NotFoundException('El enlace es inválido o ha expirado.');
    }
    if (token.usedAt) {
      throw new BadRequestException('Este enlace ya fue utilizado.');
    }
    if (token.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('El enlace ha expirado.');
    }
    if (!token.userId) {
      throw new BadRequestException('Token inválido.');
    }

    const newPasswordHash = await hashPassword(dto.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: token.userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.token.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { ok: true, mensaje: 'Tu contraseña ha sido actualizada correctamente.' };
  }
}