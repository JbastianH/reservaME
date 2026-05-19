import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, Rol } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no se definieron roles, se permite el acceso (solo requiere auth si hay JwtAuthGuard)
    if (!rolesRequeridos || rolesRequeridos.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: Rol } | undefined;

    if (!user?.role) {
      throw new ForbiddenException("No se pudo determinar el rol del usuario.");
    }

    const permitido = rolesRequeridos.includes(user.role);
    if (!permitido) {
      throw new ForbiddenException("Acceso denegado por permisos.");
    }

    return true;
  }
}