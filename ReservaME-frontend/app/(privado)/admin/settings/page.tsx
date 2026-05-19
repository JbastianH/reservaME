"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminSettings } from "@/lib/useAdminSettings";

export default function AdminSettingsPage() {
  const { data, loading, saving, error, saveReminderHours, refetch } = useAdminSettings();

  const [hours, setHours] = useState<number>(24);
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    if (data?.reminderHoursBefore != null) {
      setHours(Number(data.reminderHoursBefore));
    }
  }, [data]);

  const invalid = useMemo(() => {
    if (!Number.isFinite(hours)) return true;
    if (hours < 1) return true;
    if (hours > 168) return true; // 7 días, ajustable
    return false;
  }, [hours]);

  async function onSave() {
    setOkMsg("");

    if (invalid) return;

    const res = await saveReminderHours(hours);
    if (res.ok) {
      setOkMsg("Configuración guardada ✔︎");
      // opcional: refetch para confirmar
      await refetch();
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Configuración</h1>
          <p className="mt-1 text-sm text-neutral-600">Ajustes del sistema.</p>
        </div>

        <button
          onClick={() => void refetch()}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50"
        >
          Actualizar
        </button>
      </div>

      {okMsg ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          {okMsg}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-black">Recordatorio de reservas</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Horas antes del inicio en que se enviará el correo recordatorio.
        </p>

        <div className="mt-4">
          {loading ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
              Cargando...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-neutral-600">Horas antes</label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className={[
                    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none",
                    invalid
                      ? "border-red-400 focus:border-red-500"
                      : "border-neutral-300 focus:border-black",
                  ].join(" ")}
                />
                {invalid ? (
                  <p className="text-xs text-red-600">Debe estar entre 1 y 168 (7 días).</p>
                ) : (
                  <p className="text-xs text-neutral-500">Ej: 24 = 1 día antes.</p>
                )}
              </div>

              <div className="sm:self-end"></div>
              <button
                onClick={() => void onSave()}
                disabled={saving || invalid}
                className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
