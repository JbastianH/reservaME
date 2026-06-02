import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { TenantRequest } from "../../common/tenant/tenant-request.interface";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Auth } from "../../common/decorators/auth.decorator";
import { CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { ActivarCuentaDto } from "./dto/activar-cuenta.dto";
import { ReenviarActivacionDto } from "./dto/reenviar-activacion.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { SolicitarRecuperacionDto } from "./dto/solicitar-recuperacion.dto";

type RequestAutenticado = TenantRequest & Request & { user?: any };

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private cookieOptions() {
    const isProd = process.env.NODE_ENV === "production";

    return {
      httpOnly: true,
      secure: isProd, // en prod debe ser true (HTTPS)
      sameSite: (isProd ? "none" : "lax") as "none" | "lax",
      path: "/",
      domain: isProd ? process.env.COOKIE_DOMAIN : undefined,
    };
  }

  @Post("login")
  async login(
    @Req() req: RequestAutenticado,
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, role, tenantId } = await this.authService.login(
      req.tenant!.id,
      dto,
    );

    const opts = this.cookieOptions();
    res.clearCookie("bawstudio_at", opts);

    res.cookie("bawstudio_at", accessToken, {
      ...opts,
      maxAge: 1000 * 60 * 60 * 8, // 8h (cookie)
    });

    return { ok: true, accessToken, role, tenantId };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: RequestAutenticado) {
    return req.user;
  }

  @Auth("ADMIN")
  @Get("solo-admin")
  soloAdmin() {
    return { ok: true, mensaje: "Acceso ADMIN permitido" };
  }

  @Auth("BARBERO")
  @Get("solo-barbero")
  soloBarbero() {
    return { ok: true, mensaje: "Acceso BARBERO permitido" };
  }

  @Auth("ADMIN", "BARBERO")
  @Get("protegido")
  protegido(@Req() req: RequestAutenticado) {
    return { ok: true, user: req.user };
  }

  @Auth("ADMIN")
  @Post("admin/usuarios")
  crearUsuario(@Req() req: RequestAutenticado, @Body() dto: CrearUsuarioDto) {
    return this.authService.crearUsuarioConActivacion(req.tenant!.id, dto);
  }

  @Post("activar")
  activar(@Body() dto: ActivarCuentaDto) {
    return this.authService.activarCuenta(dto);
  }

  @Auth("ADMIN")
  @Post("admin/usuarios/reenviar-activacion")
  reenviarActivacion(
    @Req() req: RequestAutenticado,
    @Body() dto: ReenviarActivacionDto,
  ) {
    return this.authService.reenviarActivacion(req.tenant!.id, dto.email);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    const opts = this.cookieOptions();
    res.clearCookie("bawstudio_at", opts);

    return { ok: true };
  }

  @Post("solicitar-recuperacion")
  solicitarRecuperacion(
    @Req() req: RequestAutenticado,
    @Body() dto: SolicitarRecuperacionDto,
  ) {
    return this.authService.solicitarRecuperacionPassword(req.tenant!.id, dto);
  }

  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetearPassword(dto);
  }
}