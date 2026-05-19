import { apiGet, apiPost, apiPatch } from "@/lib/api";

export type AdminServicioItem = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export type AdminBarberoServicioItem = {
  id: string; // id de BarberService
  barberId: string;
  serviceId: string;
  price: string; // Decimal -> string
  durationMin: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  service?: {
    id: string;
    name: string;
    isActive: boolean;
  };
};

// Lista servicios disponibles (para asignar)
export async function listarServiciosAdmin() {
  return apiGet<AdminServicioItem[]>("/admin/servicios");
}

// Lista servicios asignados a un barbero
export async function listarServiciosDeBarberoAdmin(barberId: string) {
  return apiGet<AdminBarberoServicioItem[]>(`/admin/barberos/${barberId}/servicios`);
}

// Asigna servicio a barbero (con precio/duración inicial)
// OJO: price debe ir como string (Decimal en backend)
export async function asignarServicioABarberoAdmin(
  barberId: string,
  dto: { serviceId: string; price: number | string; durationMin: number },
) {
  const payload = {
    serviceId: dto.serviceId,
    price: String(dto.price), // <-- clave
    durationMin: Number(dto.durationMin),
  };

  return apiPost<AdminBarberoServicioItem>(`/admin/barberos/${barberId}/servicios`, payload);
}

// Actualiza precio/duración de la relación barber-service
// OJO: price debe ir como string (Decimal en backend)
export async function actualizarServicioDeBarberoAdmin(
  barberId: string,
  barberServiceId: string,
  dto: { price?: number | string; durationMin?: number },
) {
  const payload: { price?: string; durationMin?: number } = {
    ...(dto.price !== undefined ? { price: String(dto.price) } : {}),
    ...(dto.durationMin !== undefined ? { durationMin: Number(dto.durationMin) } : {}),
  };

  return apiPatch<AdminBarberoServicioItem>(
    `/admin/barberos/${barberId}/servicios/${barberServiceId}`,
    payload,
  );
}

// Activa / desactiva la relación
export async function activarServicioDeBarberoAdmin(barberId: string, barberServiceId: string) {
  return apiPatch<{ ok: true }>(
    `/admin/barberos/${barberId}/servicios/${barberServiceId}/activar`,
    {},
  );
}

export async function desactivarServicioDeBarberoAdmin(barberId: string, barberServiceId: string) {
  return apiPatch<{ ok: true }>(
    `/admin/barberos/${barberId}/servicios/${barberServiceId}/desactivar`,
    {},
  );
}