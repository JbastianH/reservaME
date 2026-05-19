import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtPayload = {
  sub: string;
  email: string;
  role: 'ADMIN' | 'BARBERO';
};

// Este es el shape REAL que vas a tener en req.user
export type RequestUser = {
  id: string;
  sub: string; // compat opcional
  email: string;
  role: 'ADMIN' | 'BARBERO';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.bawstudio_at ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    // Se normaliza para que TODO el código use req.user.id
    return {
      id: payload.sub,
      sub: payload.sub, // compat para código antiguo que use req.user.sub
      email: payload.email,
      role: payload.role,
    };
  }
}
