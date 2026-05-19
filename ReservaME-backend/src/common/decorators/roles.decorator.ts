import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export type Rol = "ADMIN" | "BARBERO";

export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);