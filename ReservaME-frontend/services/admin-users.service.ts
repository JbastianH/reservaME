import { apiGet, apiPost } from "@/lib/api";

export type AdminUserItem = {
  id: string;
  email: string;
  role: "ADMIN" | "BARBERO";
  isActive: boolean;
  createdAt: string;
};

export async function listarUsersAdmin(params?: { role?: "ADMIN" | "BARBERO" }) {
  const qs = params?.role ? `?role=${params.role}` : "";
  return apiGet<AdminUserItem[]>(`/admin/usuarios${qs}`);
}

export async function crearUserAdmin(dto: {
  email: string;
  role: "ADMIN" | "BARBERO";
  name: string;
  slug: string;
  bio?: string;
  phone?: string;
  photoUrl?: string;
}) {
  return apiPost<AdminUserItem>("/auth/admin/usuarios", dto);
}

export async function reenviarActivacionAdmin(dto: { email: string }) {
  return apiPost<{ ok: boolean; mensaje: string }>(
    "/auth/admin/usuarios/reenviar-activacion", 
    dto
  );
}