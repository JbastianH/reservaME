"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminReservasPage, ListarReservasAdminParams } from "@/services/admin-reservas.service";
import { listarReservasAdmin } from "@/services/admin-reservas.service";

export function useAdminReservas(params: ListarReservasAdminParams) {
  const [data, setData] = useState<AdminReservasPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const key = useMemo(() => JSON.stringify(params), [params]);

  const fetcher = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listarReservasAdmin(params);
      setData(res);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Error cargando reservas");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [key]); // depende del JSON params

  useEffect(() => {
    void fetcher();
  }, [fetcher]);

  return { data, loading, error, refetch: fetcher };
}