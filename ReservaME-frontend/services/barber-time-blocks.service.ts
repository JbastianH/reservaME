import { apiDelete, apiGet, apiPost } from "@/lib/api";

export type BarberTimeBlock = {
  id: string;
  tenantId: string;
  barberId: string;
  startAt: string;
  endAt: string;
  reason: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  barber?: {
    id: string;
    name: string;
    slug: string;
  };
};

export type CrearBarberTimeBlockPayload = {
  barberId?: string;
  startAtIso: string;
  reason?: string;
};

export type ListarBarberTimeBlocksParams = {
  barberId?: string;
  from?: string;
  to?: string;
};

export type DisponibilidadPublicaResponse = {
  date: string;
  closed: boolean;
  reason?: string;
  startMin?: number;
  endMin?: number;
  slots: string[];
  taken: string[];
  blocked?: string[];
};

export function obtenerDisponibilidadPublica(params: { slug: string; date: string }) {
  const searchParams = new URLSearchParams();

  searchParams.set("slug", params.slug);
  searchParams.set("date", params.date);

  return apiGet<DisponibilidadPublicaResponse>(`/public/disponibilidad?${searchParams.toString()}`);
}

function construirQuery(params?: ListarBarberTimeBlocksParams) {
  const searchParams = new URLSearchParams();

  if (params?.barberId) {
    searchParams.set("barberId", params.barberId);
  }

  if (params?.from) {
    searchParams.set("from", params.from);
  }

  if (params?.to) {
    searchParams.set("to", params.to);
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export function listarBarberTimeBlocks(params?: ListarBarberTimeBlocksParams) {
  return apiGet<BarberTimeBlock[]>(`/barber-time-blocks${construirQuery(params)}`);
}

export function crearBarberTimeBlock(payload: CrearBarberTimeBlockPayload) {
  return apiPost<BarberTimeBlock>("/barber-time-blocks", payload);
}

export function eliminarBarberTimeBlock(id: string) {
  return apiDelete<{
    ok: true;
    block: BarberTimeBlock;
  }>(`/barber-time-blocks/${id}`);
}

export function construirStartAtIsoDesdeFechaHoraLocal(params: { date: string; time: string }) {
  const [year, month, day] = params.date.split("-").map(Number);
  const [hour, minute] = params.time.split(":").map(Number);

  const startAt = new Date(year, month - 1, day, hour, minute);

  return startAt.toISOString();
}
