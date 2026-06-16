import { apiGet, apiPatch } from "@/lib/api";

export type AdminTenantSettings = {
  id: string | null;
  tenantId: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  headerColor: string;
  footerColor: string;
  fontFamily: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminTenantConfiguracion = {
  id: string;
  name: string;
  domain: string;
  email: string | null;
  address: string | null;
  instagramUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings: AdminTenantSettings;
};

export type ObtenerAdminTenantConfiguracionResponse = {
  ok: true;
  tenant: AdminTenantConfiguracion;
};

export type ActualizarAdminTenantConfiguracionPayload = {
  name?: string;
  address?: string;
  instagramUrl?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headerColor?: string;
  footerColor?: string;
  fontFamily?: string;
};

export type ActualizarAdminTenantConfiguracionResponse = {
  ok: true;
  mensaje: string;
  tenant: AdminTenantConfiguracion;
};

export function obtenerConfiguracionTenantAdmin() {
  return apiGet<ObtenerAdminTenantConfiguracionResponse>("/admin/tenant/configuracion");
}

export function actualizarConfiguracionTenantAdmin(
  payload: ActualizarAdminTenantConfiguracionPayload,
) {
  return apiPatch<ActualizarAdminTenantConfiguracionResponse>(
    "/admin/tenant/configuracion",
    payload,
  );
}
