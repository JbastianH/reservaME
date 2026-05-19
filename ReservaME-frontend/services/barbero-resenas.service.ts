import { apiGet, apiPatch } from "@/lib/api";

export type BarberoResenaItem = {
  id: string;
  rating: number;
  comment?: string | null;
  visible: boolean;
  createdAt: string;

  barber?: {
    id: string;
    name: string;
    slug: string;
  };
  reservation?: {
    clientName: string;
  } | null;
};

export type BarberoResenasPage = {
  page: number;
  pageSize: number;
  total: number;
  items: BarberoResenaItem[];
};

export type ListarBarberoResenasParams = {
  page?: number;
  pageSize?: number;
  visible?: boolean;
  q?: string;
};

function toQuery(params?: ListarBarberoResenasParams) {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.visible !== undefined) qs.set("visible", String(params.visible));
  if (params.q) qs.set("q", params.q);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function listarMisResenas(params?: ListarBarberoResenasParams) {
  return apiGet<BarberoResenasPage>(`/barbero/resenas${toQuery(params)}`);
}

export function setVisibleMiResena(reviewId: string, visible: boolean) {
  return apiPatch<{ ok: true; review: unknown }>(`/barbero/resenas/${reviewId}/visible`, { visible });
}