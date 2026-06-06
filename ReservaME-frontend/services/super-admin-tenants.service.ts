

import { apiGet, apiPatch, apiPost } from "@/lib/api";

export type TenantSettings = {
  id: string;
  tenantId: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  headerColor: string;
  footerColor: string;
  fontFamily: string;
  createdAt: string;
  updatedAt: string;
};

export type TenantAdminUser = {
  id: string;
  email: string;
  role: "ADMIN";
  isActive: boolean;
};

export type SuperAdminTenant = {
  id: string;
  name: string;
  domain: string;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings: TenantSettings | null;
  users: TenantAdminUser[];
};

export type CrearTenantPayload = {
  name: string;
  domain: string;
  adminEmail: string;
  address?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerColor?: string;
  footerColor?: string;
  fontFamily?: string;
  isActive?: boolean;
};

export type ActualizarTenantPayload = Partial<CrearTenantPayload>;

export type CrearTenantResponse = {
  ok: true;
  mensaje: string;
  tenant: SuperAdminTenant;
  admin: TenantAdminUser & { tenantId: string };
};

export type ActualizarTenantResponse = {
  ok: true;
  tenant: SuperAdminTenant;
};


export type ReenviarActivacionTenantResponse = {
  ok: true;
  mensaje: string;
};

export function reenviarActivacionTenantSuperAdmin(id: string) {
  return apiPost<ReenviarActivacionTenantResponse>(
    `/super-admin/tenants/${id}/reenviar-activacion`,
  );
}

export function listarTenantsSuperAdmin() {
  return apiGet<SuperAdminTenant[]>("/super-admin/tenants");
}

export function obtenerTenantSuperAdmin(id: string) {
  return apiGet<SuperAdminTenant>(`/super-admin/tenants/${id}`);
}

export function crearTenantSuperAdmin(payload: CrearTenantPayload) {
  return apiPost<CrearTenantResponse>("/super-admin/tenants", payload);
}

export function actualizarTenantSuperAdmin(
  id: string,
  payload: ActualizarTenantPayload,
) {
  return apiPatch<ActualizarTenantResponse>(`/super-admin/tenants/${id}`, payload);
}

export function activarTenantSuperAdmin(id: string) {
  return apiPatch<ActualizarTenantResponse>(`/super-admin/tenants/${id}/activar`);
}

export function desactivarTenantSuperAdmin(id: string) {
  return apiPatch<ActualizarTenantResponse>(
    `/super-admin/tenants/${id}/desactivar`,
  );
}