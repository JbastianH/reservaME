import { apiGet, apiPost } from "@/lib/api";

export type PublicResenaItem = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reservation: {
    clientName: string;
    service: { name: string };
  };
};

export function listarResenasPorBarberoPublico(slug: string,  tenantHost?: string | null, limit = 10) {
  return apiGet<PublicResenaItem[]>(
    `/public/barberos/${encodeURIComponent(slug)}/resenas?limit=${limit}`,
    { auth: false, tenantHost },
  );

  
}

export type ResenaTokenPublicaResponse = {
  ok: true;
  token: { usedAt: string | null; expiresAt: string };
  reserva: {
    id: string;
    status: string;
    clientName: string;
    barber: { id: string; name: string; slug: string };
    service: { id: string; name: string };
  };
  yaTieneResena?: boolean;
};

export function obtenerResenaPorToken(token: string, tenantHost?: string | null) {
  return apiGet<ResenaTokenPublicaResponse>(`/public/resenas/${encodeURIComponent(token)}`, {
    auth: false,
    tenantHost,
  });
}

export function crearResenaConToken(token: string, dto: { rating: number; comment?: string }, tenantHost?: string | null) {
  return apiPost<{ ok: true; mensaje: string }>(
    `/public/resenas/${encodeURIComponent(token)}`,
    dto,
    { auth: false, tenantHost },
  );
}

