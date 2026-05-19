"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiError } from "@/lib/api";
import type {
  BarberoReservasResponse,
  GetBarberoReservasParams,
} from "@/services/reservas.service";
import { getBarberoReservas } from "@/services/reservas.service";

export function useBarberoReservas(params: GetBarberoReservasParams) {
  const [data, setData] = useState<BarberoReservasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");

    getBarberoReservas(params)
      .then((res) => {
        if (!alive) return;
        setData(res);
      })
      .catch((e: ApiError) => {
        if (!alive) return;
        setData(null);

        if (e?.status === 401) setError("Tu sesión expiró. Vuelve a iniciar sesión.");
        else setError(e?.message ?? "No se pudieron cargar las reservas.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [paramsKey, refreshKey]);

  return { data, loading, error, refetch };
}
