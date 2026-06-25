import type { Metadata } from "next";
import { headers } from "next/headers";
import Header from "@/componentes/layout/Header";
import Footer from "@/componentes/layout/Footer";
import { SesionProvider } from "@/context/SesionProvider";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";
import type { TenantPublico } from "@/services/tenant-publico.service";

async function obtenerTenantSeguro(tenantHost: string | null) {
  try {
    return await obtenerTenantPublico(tenantHost);
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const tenantHost = requestHeaders.get("host");

  const tenant = await obtenerTenantSeguro(tenantHost);

  const tenantName = tenant?.name ?? "ReservaME";

  const protocolo = tenantHost?.includes("localhost") ? "http" : "https";

  const baseUrl = tenantHost ? `${protocolo}://${tenantHost}` : "http://localhost:3001";

  const logoBase = tenant?.settings.logoUrl || "/favicon.ico";

  const faviconUrl = tenant?.settings.logoUrl
    ? `${tenant.settings.logoUrl}?tenant=${tenant.id}`
    : "/favicon.ico";

  const description = `Reserva tu hora en ${tenantName}.`;

  return {
    metadataBase: new URL(baseUrl),
    title: tenantName,
    description,
    icons: {
      icon: [
        {
          url: faviconUrl,
        },
      ],
      shortcut: [
        {
          url: faviconUrl,
        },
      ],
      apple: [
        {
          url: faviconUrl,
        },
      ],
    },
    openGraph: {
      title: tenantName,
      description,
      url: baseUrl,
      siteName: tenantName,
      images: logoBase ? [{ url: logoBase }] : [],
      type: "website",
    },
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const tenantHost = requestHeaders.get("host");

  const tenant: TenantPublico | null = await obtenerTenantSeguro(tenantHost);

  const tenantName = tenant?.name ?? "ReservaME";
  const logoUrl = tenant?.settings.logoUrl ?? null;
  const headerColor = tenant?.settings.headerColor ?? "#ffffff";
  const footerColor = tenant?.settings.footerColor ?? "#000000";

  return (
    <SesionProvider>
      <Header
        tenantName={tenantName}
        logoUrl={logoUrl}
        headerColor={headerColor}
        instagramUrl={tenant?.instagramUrl}
      />

      <main>{children}</main>

      <Footer tenantName={tenantName} footerColor={footerColor} instagramUrl={tenant?.instagramUrl} />
    </SesionProvider>
  );
}
