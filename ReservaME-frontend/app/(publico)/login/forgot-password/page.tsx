import { Suspense } from "react";
import { Metadata } from "next";
import { headers } from "next/headers";
import ForgotPasswordClient from "./ForgotPasswordClient";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";
import type { TenantPublico } from "@/services/tenant-publico.service";

export const metadata: Metadata = {
  title: "Recuperar acceso",
  robots: {
    index: false,
    follow: false,
  },
};

function ForgotPasswordFallback({ tenantName }: { tenantName: string }) {
  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-black px-4 py-10">
      <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-8 py-10 text-center shadow-2xl backdrop-blur-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />

        <div>
          <p className="text-sm font-semibold tracking-[0.3em] text-white/50 uppercase">
            {tenantName}
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-white">Cargando recuperación...</h1>

          <p className="mt-2 text-sm text-white/50">Preparando formulario de acceso.</p>
        </div>
      </div>
    </main>
  );
}

async function obtenerTenantSeguro(tenantHost: string | null): Promise<TenantPublico | null> {
  try {
    return await obtenerTenantPublico(tenantHost);
  } catch {
    return null;
  }
}

export default async function ForgotPasswordPage() {
  const requestHeaders = await headers();
  const tenantHost = requestHeaders.get("host");

  const tenant = await obtenerTenantSeguro(tenantHost);
  const tenantName = tenant?.name ?? "ReservaME";

  return (
    <Suspense fallback={<ForgotPasswordFallback tenantName={tenantName} />}>
      <ForgotPasswordClient initialTenant={tenant} />
    </Suspense>
  );
}
