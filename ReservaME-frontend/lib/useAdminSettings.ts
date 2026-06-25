"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiError } from "@/lib/api";
import { getAdminSettings, updateAdminSettings } from "@/services/admin-settings.service";

export type AdminSettings = {
  reminderHoursBefore: number;
  cancellationHoursBefore: number;
};

export function useAdminSettings() {
  const [data, setData] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getAdminSettings();

      setData({
        reminderHoursBefore: Number(res.settings.reminderHoursBefore ?? 24),
        cancellationHoursBefore: Number(res.settings.cancellationHoursBefore ?? 3),
      });
    } catch (e) {
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

  const saveSettings = useCallback(
    async (payload: { reminderHoursBefore: number; cancellationHoursBefore: number }) => {
      setSaving(true);
      setError("");

      try {
        const res = await updateAdminSettings(payload);

        setData({
          reminderHoursBefore: Number(res.settings.reminderHoursBefore ?? 24),
          cancellationHoursBefore: Number(res.settings.cancellationHoursBefore ?? 3),
        });

        return { ok: true as const };
      } catch (e) {
        const err = e as ApiError;

        setError(err?.message ?? "No se pudo guardar.");
        return { ok: false as const };
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return {
    data,
    loading,
    saving,
    error,
    refetch,
    saveSettings,
  };
}
