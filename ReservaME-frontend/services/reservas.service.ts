import { apiGet } from "@/lib/api";
import { apiPatch } from "@/lib/api";


export type EstadoReserva = "CONFIRMADA" | "COMPLETADA" | "CANCELADA";

export type ReservaBarbero = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string; 
  service: {      
    id: string;
    name: string;
  };
  startAt: string;
  endAt: string;
  status: EstadoReserva;
  priceFinal: string;
};

export type BarberoReservasResponse = {
  ok: true;
  items: ReservaBarbero[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type GetBarberoReservasParams = {
  page?: number;
  pageSize?: number;
  status?: EstadoReserva;
  q?: string;
  from?: string;
  to?: string;
};

export function getBarberoReservas(params: GetBarberoReservasParams) {
  const qs = new URLSearchParams();

  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);

  const query = qs.toString();
  const path = `barbero/reservas${query ? `?${query}` : ""}`;

  return apiGet<BarberoReservasResponse>(path);
}

export function completarReservaBarbero(id: string) {
  return apiPatch<{ ok: true }>(`/barbero/reservas/${id}/completar`, undefined);
}

export async function reprogramarReservaBarbero(reservaId: string, startAtIso: string) {
  return apiPatch<{ ok: true }>(`/barbero/reservas/${reservaId}/reprogramar`, { startAt: startAtIso });
}

export async function reprogramarReservaAdmin(reservaId: string, startAtIso: string) {
  return apiPatch<{ ok: true }>(`/admin/reservas/${reservaId}/reprogramar`, { startAt: startAtIso });
}

export function cancelarReservaBarbero(reservaId: string) {
  return apiPatch<{ ok: true }>(`/barbero/reservas/${reservaId}/cancelar`);
}

export function cancelarReservaAdmin(reservaId: string) {
  return apiPatch<{ ok: true }>(`/admin/reservas/${reservaId}/cancelar`);
}

