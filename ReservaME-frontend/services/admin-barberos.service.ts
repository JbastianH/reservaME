import { apiGet, apiPost, apiPatch } from "@/lib/api";

export type AdminBarberoApiItem = {
  id: string;
  userId: string | null;
  user?: { email: string } | null;

  name: string;
  slug: string;
  bio?: string | null;
  phone?: string | null;
  photoUrl?: string | null;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getAdminBarberos() {
  return apiGet<AdminBarberoApiItem[]>("/admin/barberos");
}

export async function crearBarberoAdmin(dto: {
  userId?: string;
  name: string;
  slug: string;
  bio?: string;
  phone?: string;
  photoUrl?: string;
}) {
  return apiPost<AdminBarberoApiItem>("/admin/barberos", dto);
}

export async function actualizarBarberoAdmin(
  id: string,
  dto: {
    name?: string;
    slug?: string;
    bio?: string;
    phone?: string;
    photoUrl?: string;
  },
) {
  return apiPatch<AdminBarberoApiItem>(`/admin/barberos/${id}`, dto);
}

export async function activarBarberoAdmin(id: string) {
  return apiPatch<{ ok: true }>(`/admin/barberos/${id}/activar`, {});
}

export async function desactivarBarberoAdmin(id: string) {
  return apiPatch<{ ok: true }>(`/admin/barberos/${id}/desactivar`, {});
}