import { apiGet, apiPatch } from "@/lib/api";

export type BarberoServicioItem = {
  id: string; //
  barberId: string;
  serviceId: string;
  price: string; 
  durationMin: number;
  isActive: boolean;
  service: {
    id: string;
    name: string;
    description?: string | null;
    isActive?: boolean;
  };
};

export type BarberoServiciosResponse = BarberoServicioItem[];

export async function getMisServiciosBarbero() {
  return apiGet<BarberoServiciosResponse>("/barbero/servicios");
}

export type UpdateMiServicioPayload = {
  price?: number;
  durationMin?: number;
  isActive?: boolean;
};

export async function actualizarMiServicioBarbero(
  barberServiceId: string,
  payload: { price?: number; durationMin?: number; isActive?: boolean },
) {
  return apiPatch(`/barbero/servicios/${barberServiceId}`, payload);
}