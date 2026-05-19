"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiError } from "@/lib/api";
import type { AdminDashboardParams, AdminDashboardResponse } from "@/services/admin-dashboard.service";
import { getAdminDashboard } from "@/services/admin-dashboard.service";

export function useAdminDashboard(params: AdminDashboardParams) {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const key = useMemo(() => JSON.stringify(params), [params]);

  const fetcher = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getAdminDashboard(params);
      setData(res);
    } catch (e: any) {
      const err = e as ApiError;
      if (err?.status === 401) setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      else setError(err?.message ?? "No se pudieron cargar los KPIs.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [key]); // key asegura refresco si cambia params

  useEffect(() => {
    void fetcher();
  }, [fetcher]);

  return { data, loading, error, refetch: fetcher };
}