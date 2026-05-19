import { apiGet } from "@/lib/api";

export type DisponibilidadPublicaResponse = {
  date: string;
  closed: boolean;
  startMin?: number;
  endMin?: number;
  slots: string[];
  taken: string[];
};

export function obtenerDisponibilidadPublica(params: { slug: string; date: string }) {
  const qs = `?slug=${encodeURIComponent(params.slug)}&date=${encodeURIComponent(params.date)}`;
  return apiGet<DisponibilidadPublicaResponse>(`/public/disponibilidad${qs}`, { auth: false });
}