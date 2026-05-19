"use client";

import { useCallback, useEffect, useState } from "react";
import { getBarberoMe, type BarberoMe } from "@/services/barbero-perfil.service";

export function useBarberoMe() {
  const [data, setData] = useState<BarberoMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getBarberoMe();
      setData(res);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "No se pudo cargar el perfil.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}