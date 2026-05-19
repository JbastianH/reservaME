import { apiGet, apiPost } from "@/lib/api";

export type ReservaGestionPublicaResponse = {
  ok: true;
  token: {
    usedAt: string | null;
    expiresAt: string;
  };
  reserva: {
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    priceFinal: string;
    durationFinalMin: number;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    barber: { id: string; name: string; slug: string };
    service: { id: string; name: string };
  };
};

export function getGestionReserva(token: string) {
  return apiGet<ReservaGestionPublicaResponse>(
    `/public/reservas/gestion/${encodeURIComponent(token)}`,
    { auth: false },
  );
}

export function cancelarGestionReserva(token: string) {
  return apiPost<{ ok: true; mensaje: string }>(
    `/public/reservas/gestion/${encodeURIComponent(token)}/cancelar`,
    {},
    { auth: false },
  );
}

export function reprogramarGestionReserva(token: string, startAt: string) {
  return apiPost<{ ok: true; mensaje: string }>(
    `/public/reservas/gestion/${encodeURIComponent(token)}/reprogramar`,
    { startAt },
    { auth: false },
  );
}
