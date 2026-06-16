import type { Metadata } from "next";
import { headers } from "next/headers";
import BarberoLayoutClient from "../BarberoLayoutClient";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";

async function obtenerTenantSeguro() {
  try {
    const requestHeaders = await headers();
    const tenantHost = requestHeaders.get("host");

    return await obtenerTenantPublico(tenantHost);
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await obtenerTenantSeguro();

  const tenantName = tenant?.name ?? "ReservaME";
  const logoUrl = tenant?.settings?.logoUrl || "/favicon.ico";

  return {
    title: `Panel Barbero | ${tenantName}`,
    icons: {
      icon: logoUrl,
      shortcut: logoUrl,
      apple: logoUrl,
    },
  };
}

export default async function BarberoLayout({ children }: { children: React.ReactNode }) {
  const tenant = await obtenerTenantSeguro();

  const tenantName = tenant?.name ?? "ReservaME";

  return <BarberoLayoutClient tenantName={tenantName}>{children}</BarberoLayoutClient>;
}
