"use client";

import { useEffect, useState } from "react";
import { useLoading } from "@/context/LoadingProvider";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";

export default function PageSkeleton() {
  const { isLoading } = useLoading();

  const [mounted, setMounted] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/img/logoPNG-sinFondo.png");
  const [tenantName, setTenantName] = useState("ReservaME");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function cargarTenant() {
      try {
        const tenantHost = window.location.host;
        const tenant = await obtenerTenantPublico(tenantHost);

        setTenantName(tenant.name || "ReservaME");
        setLogoUrl(tenant.settings?.logoUrl || "/img/logoPNG-sinFondo.png");
      } catch {
        setTenantName("ReservaME");
        setLogoUrl("/img/logoPNG-sinFondo.png");
      }
    }

    void cargarTenant();
  }, []);

  if (!mounted) return null;

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="space-y-4 text-center drop-shadow-[0_0_15px_rgba(255,255,255,1.0)]">
            <div className="flex justify-center">
              <img
                src={logoUrl}
                alt={`Cargando ${tenantName}`}
                className="h-40 w-40 animate-pulse object-contain"
              />
            </div>

            <p className="text-sm font-medium text-black">Cargando...</p>
          </div>
        </div>
      )}
    </>
  );
}
