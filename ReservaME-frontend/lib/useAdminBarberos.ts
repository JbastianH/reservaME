"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "@/lib/api";
import {
  getAdminBarberos,
  type AdminBarberoApiItem,
} from "@/services/admin-barberos.service";

export function useAdminBarberos() {
  const [data, setData] = useState<AdminBarberoApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getAdminBarberos();
      setData(res);
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 401) setError("Tu sesión expiró.");
      else setError(err?.message ?? "No se pudieron cargar los barberos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}