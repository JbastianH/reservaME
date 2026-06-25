export type Rol = "SUPER_ADMIN" | "ADMIN" | "BARBERO";

export type Usuario = {
  id: string;
  email: string;
  role: Rol;
  isActive: boolean;
};

export type LoginResponse = {
  accessToken: string;
};