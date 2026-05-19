"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "@/lib/api";
import { getAdminSettings, updateReminderHoursBefore } from "@/services/admin-settings.service";

export function useAdminSettings() {
  const [data, setData] = useState<{ reminderHoursBefore: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminSettings();
      setData(res.settings);
    } catch (e: any) {
      const err = e as ApiError;
      setData(null);
      setError(err?.message ?? "No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const saveReminderHours = useCallback(async (hours: number) => {
    setSaving(true);
    setError("");
    try {
      const res = await updateReminderHoursBefore(hours);
      setData(res.settings);
      return { ok: true as const };
    } catch (e: any) {
      const err = e as ApiError;
      setError(err?.message ?? "No se pudo guardar.");
      return { ok: false as const };
    } finally {
      setSaving(false);
    }
  }, []);

  return { data, loading, saving, error, refetch, saveReminderHours };
}