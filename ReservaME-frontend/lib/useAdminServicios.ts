"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "@/lib/api";
import { getAdminServicios } from "@/services/servicios.service";
import type { AdminServicioApiItem } from "@/services/servicios.service";

export function useAdminServicios() {
  const [data, setData] = useState<AdminServicioApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getAdminServicios();
      setData(res);
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 401) setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      else if (err?.status === 403) setError("No autorizado.");
      else setError(err?.message ?? "No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}