"use client";

import { useCallback, useEffect, useState } from "react";
import { listarUsersAdmin, type AdminUserItem } from "@/services/admin-users.service";

export function useAdminUsers(role: "ADMIN" | "BARBERO") {
  const [data, setData] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetcher = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const res = await listarUsersAdmin({ role });
      setData(res);
    } catch (e) {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void fetcher();
  }, [fetcher]);

  return { data, loading, error, refetch: fetcher };
}