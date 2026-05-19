"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listarMiPortafolio,
  PortafolioItem,
} from "@/services/barbero-portafolio.service";

export function useMiPortafolio() {
  const [data, setData] = useState<PortafolioItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listarMiPortafolio();
      setData(res);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "No se pudo cargar el portafolio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}