"use client";

import { useMemo, useState } from "react";
import { useAdminDashboard } from "@/lib/useAdminDashboard";
import type { DashboardRange } from "@/services/admin-dashboard.service";

function formatCLP(value: unknown) {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
}

function todayYYYYMMDD() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toISOStart(dateYYYYMMDD: string) {
  // Se construye inicio del día local
  return new Date(`${dateYYYYMMDD}T00:00:00`).toISOString();
}

function toISOEndExclusive(dateYYYYMMDD: string) {
  // Se construye fin exclusivo: día siguiente 00:00 local
  const d = new Date(`${dateYYYYMMDD}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function RangeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-lg border px-3 py-2 text-sm",
        active
          ? "border-black bg-black text-white"
          : "border-neutral-300 bg-white text-black hover:bg-neutral-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<DashboardRange>("HOY");

  const [fromDate, setFromDate] = useState<string>(todayYYYYMMDD());
  const [toDate, setToDate] = useState<string>(todayYYYYMMDD());

  const [customParams, setCustomParams] = useState<{ from?: string; to?: string }>({});

  const params = useMemo(() => {
    if (range === "CUSTOM") {
      return { range, ...customParams };
    }
    return { range };
  }, [range, customParams]);

  const { data, loading, error, refetch } = useAdminDashboard(params);

  const k = data?.kpis;

  function aplicarRango() {
    if (toDate < fromDate) return;

    setRange("CUSTOM"); // asegura estado
    setCustomParams({
      from: toISOStart(fromDate),
      to: toISOEndExclusive(toDate),
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">KPIs básicos por rango.</p>
        </div>

        <button
          onClick={() => void refetch()}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50"
        >
          Actualizar
        </button>
      </div>

      {/* Rangos */}
      <div className="flex flex-wrap gap-2">
        <RangeButton active={range === "HOY"} onClick={() => setRange("HOY")}>
          Hoy
        </RangeButton>

        <RangeButton active={range === "MES"} onClick={() => setRange("MES")}>
          Este mes
        </RangeButton>

        <RangeButton
          active={range === "CUSTOM"}
          onClick={() => {
            setRange("CUSTOM");
            setCustomParams({
              from: toISOStart(fromDate),
              to: toISOEndExclusive(toDate),
            });
          }}
        >
          Elegir rango
        </RangeButton>

        <RangeButton active={range === "TOTAL"} onClick={() => setRange("TOTAL")}>
          Total histórico
        </RangeButton>
      </div>

      {/* Form rango */}
      {range === "CUSTOM" ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-600">Desde</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-600">Hasta</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
              />
              {toDate < fromDate ? (
                <p className="text-xs text-red-600">El “Hasta” no puede ser menor que “Desde”.</p>
              ) : null}
            </div>

            <button
              onClick={() => aplicarRango()}
              disabled={toDate < fromDate}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              Aplicar
            </button>
          </div>

          <p className="mt-2 text-xs text-neutral-500">
            El rango toma el día completo (00:00 a 23:59) para ambas fechas.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          Cargando KPIs...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Total reservas</p>
            <p className="mt-1 text-2xl font-semibold text-black">{k?.total ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Confirmadas</p>
            <p className="mt-1 text-2xl font-semibold text-black">{k?.confirmadas ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Completadas</p>
            <p className="mt-1 text-2xl font-semibold text-black">{k?.completadas ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Canceladas</p>
            <p className="mt-1 text-2xl font-semibold text-black">{k?.canceladas ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Ingresos (completadas)</p>
            <p className="mt-1 text-2xl font-semibold text-black">
              {formatCLP(k?.ingresoCompletadas ?? "0")}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
