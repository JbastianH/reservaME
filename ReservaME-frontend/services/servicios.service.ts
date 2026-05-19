import { apiGet, apiPost, apiPatch } from "@/lib/api";

export type AdminServicioApiItem = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getAdminServicios() {
  return apiGet<AdminServicioApiItem[]>("/admin/servicios");
}

export async function crearServicioAdmin(dto: { name: string; description?: string | null }) {
  return apiPost<AdminServicioApiItem>("/admin/servicios", dto);
}

export async function actualizarServicioAdmin(
  id: string,
  dto: { name?: string; description?: string | null },
) {
  return apiPatch<AdminServicioApiItem>(`/admin/servicios/${id}`, dto);
}

// Si tu backend tiene endpoints separados:
export async function activarServicioAdmin(id: string) {
  return apiPatch<{ ok: true }>(`/admin/servicios/${id}/activar`, {});
}

export async function desactivarServicioAdmin(id: string) {
  return apiPatch<{ ok: true }>(`/admin/servicios/${id}/desactivar`, {});
}