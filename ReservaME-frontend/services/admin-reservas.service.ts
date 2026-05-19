import { apiGet, apiPatch } from "@/lib/api";

export type ReservaEstado = "CONFIRMADA" | "COMPLETADA" | "CANCELADA";

export type AdminReservaItem = {
  id: string;

  // cliente
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  comment?: string | null;

  // fecha/hora
  startAt: string; // ISO
  endAt: string;   // ISO

  // estado
  status: ReservaEstado;

  // totales (según lo que tengas)
  priceFinal?: string | number | null; // puede venir Decimal->string
  durationFinalMin?: number | null;

  // relaciones útiles para filtros
  barber?: { id: string; name: string; slug: string } | null;
  service?: { id: string; name: string } | null;

  createdAt: string;
  updatedAt: string;
};

export type AdminReservasPage = {
  items: AdminReservaItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ListarReservasAdminParams = {
  page?: number;
  pageSize?: number;

  barberId?: string;
  status?: ReservaEstado;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  q?: string;
};

function toQuery(params?: ListarReservasAdminParams) {
  if (!params) return "";
  const qs = new URLSearchParams();

  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));

  if (params.barberId) qs.set("barberId", params.barberId);
  if (params.status) qs.set("status", params.status);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.q) qs.set("q", params.q);

  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function listarReservasAdmin(params?: ListarReservasAdminParams) {
  return apiGet<AdminReservasPage>(`/admin/reservas${toQuery(params)}`);
}

export async function completarReservaAdmin(id: string) {
  return apiPatch<{ ok: true }>(`/admin/reservas/${id}/completar`, {});
}

