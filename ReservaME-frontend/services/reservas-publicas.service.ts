import { apiGet, apiPost } from "@/lib/api";

export type CrearReservaPublicaPayload = {
  barberId: string;
  barberServiceId: string;
  startAt: string; // ISO
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  comment: string | null;
};

export type CrearReservaPublicaResponse = {
  ok: true;
  reserva: {
    id: string;
    barberId: string;
    serviceId: string;
    barberServiceId: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    comment: string | null;
    startAt: string;
    endAt: string;
    status: string;
    priceFinal: string;
    durationFinalMin: number;
  };
};

export type ReservaResumenPublicoResponse = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  priceFinal: string;
  durationFinalMin: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  comment: string | null;
  barber: { id: string; name: string; slug: string };
  service: { id: string; name: string };
};

export function crearReservaPublica(payload: CrearReservaPublicaPayload) {
  return apiPost<CrearReservaPublicaResponse>("/public/reservas", payload, { auth: false });
}

export function obtenerResumenReservaPublica(id: string) {
  return apiGet<ReservaResumenPublicoResponse>(`/public/reservas/${encodeURIComponent(id)}`, {
    auth: false,
  });
}
