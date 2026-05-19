"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "@/lib/api";
import type { BarberoServiciosResponse } from "@/services/barbero-servicios.service";
import { getMisServiciosBarbero } from "@/services/barbero-servicios.service";

export function useBarberoServicios() {
  const [data, setData] = useState<BarberoServiciosResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getMisServiciosBarbero();
      setData(res);
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 401) setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      else setError(err?.message ?? "No se pudieron cargar tus servicios.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}