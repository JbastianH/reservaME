"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminBarberoServicioItem } from "@/services/admin-barbero-servicios.service";
import { listarServiciosDeBarberoAdmin } from "@/services/admin-barbero-servicios.service";

export function useAdminBarberoServicios(barberId?: string) {
  const [data, setData] = useState<AdminBarberoServicioItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const refetch = useCallback(async () => {
    if (!barberId) return;

    setLoading(true);
    setError("");

    try {
      const res = await listarServiciosDeBarberoAdmin(barberId);
      setData(res);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "No se pudo cargar la lista.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [barberId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}