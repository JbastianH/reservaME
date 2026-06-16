import { apiGet } from "@/lib/api";

export type TenantPublicoSettings = {
  logoUrl: string | null;
  heroImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  headerColor: string;
  footerColor: string;
  fontFamily: string;
  cancellationHoursBefore: number;
};

export type TenantPublico = {
  id: string;
  name: string;
  domain: string;
  email: string | null;
  address: string | null;
  instagramUrl?: string | null;
  settings: TenantPublicoSettings;
};

export function obtenerTenantPublico(tenantHost?: string | null) {
  return apiGet<TenantPublico>("/public/tenant", {
    auth: false,
    tenantHost,
  });
}
