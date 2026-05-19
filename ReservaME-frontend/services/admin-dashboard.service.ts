import { apiGet } from "@/lib/api";

export type DashboardRange = "HOY" | "MES" | "CUSTOM" | "TOTAL";

export type AdminDashboardKpis = {
  total: number;
  confirmadas: number;
  completadas: number;
  canceladas: number;
  ingresoCompletadas: string;
};

export type AdminDashboardResponse = {
  ok: true;
  range: DashboardRange;
  from: string | null; 
  to: string | null;   
  kpis: AdminDashboardKpis;
};

export type AdminDashboardParams = {
  range?: DashboardRange;
  from?: string; 
  to?: string;   
};

function toQuery(params?: AdminDashboardParams) {
  if (!params) return "";
  const qs = new URLSearchParams();

  if (params.range) qs.set("range", params.range);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);

  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function getAdminDashboard(params?: AdminDashboardParams) {
  return apiGet<AdminDashboardResponse>(`/admin/reservas/kpis${toQuery(params)}`);
}