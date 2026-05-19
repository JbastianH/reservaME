"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getHorarioBarbero,
  patchHorarioBarbero,
  type DayOfWeek,
  type HorarioBarberoItem,
} from "@/services/horario-barbero.service";

const DIAS: Array<{ key: DayOfWeek; label: string }> = [
  { key: "MON", label: "Lunes" },
  { key: "TUE", label: "Martes" },
  { key: "WED", label: "Miércoles" },
  { key: "THU", label: "Jueves" },
  { key: "FRI", label: "Viernes" },
  { key: "SAT", label: "Sábado" },
  { key: "SUN", label: "Domingo" },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function minToHHmm(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function hhToMin(hh: number) {
  return hh * 60;
}

function buildHourOptions() {
  // Se generan horas en bloques de 1 hora (00:00 a 23:00).
  const opts: Array<{ label: string; value: number }> = [];
  for (let h = 0; h <= 23; h++) {
    opts.push({ label: `${pad2(h)}:00`, value: hhToMin(h) });
  }
  return opts;
}

const HOUR_OPTS = buildHourOptions();

type Row = {
  day: DayOfWeek;
  isClosed: boolean;
  startMin: number;
  endMin: number;
};

function normalizeFromApi(items: HorarioBarberoItem[]): Row[] {
  // Se asegura que existan los 7 días aunque el backend no los devuelva todos.
  const map = new Map<DayOfWeek, HorarioBarberoItem>();
  for (const it of items) map.set(it.day, it);

  return DIAS.map(({ key }) => {
    const it = map.get(key);
    return {
      day: key,
      isClosed: it?.isClosed ?? false,
      startMin: it?.startMin ?? 600, // 10:00
      endMin: it?.endMin ?? 1200, // 20:00
    };
  });
}

export default function HorarioBarberoPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState<Row[]>([]);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  async function cargar() {
    setErr("");
    setOk("");
    setLoading(true);
    try {
      const r = await getHorarioBarbero();
      setRows(normalizeFromApi(r));
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "No se pudo cargar el horario.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const invalid = useMemo(() => {
    // Se valida que si no está cerrado, startMin < endMin.
    for (const r of rows) {
      if (!r.isClosed && r.startMin >= r.endMin) return true;
    }
    return false;
  }, [rows]);

  async function guardar() {
    setErr("");
    setOk("");

    if (invalid) {
      setErr("Hay días con rango inválido (inicio debe ser menor que fin).");
      return;
    }

    setSaving(true);
    try {
      await patchHorarioBarbero(
        rows.map((r) => ({
          day: r.day,
          isClosed: r.isClosed,
          startMin: r.isClosed ? undefined : r.startMin,
          endMin: r.isClosed ? undefined : r.endMin,
        })),
      );
      setOk("Horario actualizado ✔︎");
      await cargar();
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "No se pudo guardar el horario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-black">Horario de atención</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Define días cerrados y rango horario. La disponibilidad pública usa esta configuración.
          </p>
        </div>

        <button
          onClick={() => void cargar()}
          disabled={loading || saving}
          className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
        >
          Recargar
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {ok ? (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          {ok}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
          Cargando horario...
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {rows.map((r) => {
              const diaLabel = DIAS.find((d) => d.key === r.day)?.label ?? r.day;
              const rowInvalid = !r.isClosed && r.startMin >= r.endMin;

              return (
                <div
                  key={r.day}
                  className={[
                    "rounded-xl border p-3",
                    rowInvalid ? "border-red-300 bg-red-50" : "border-neutral-200 bg-white",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-sm font-medium text-black">{diaLabel}</div>

                      <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={r.isClosed}
                          disabled={saving}
                          onChange={(e) => {
                            const v = e.target.checked;
                            setRows((prev) =>
                              prev.map((x) =>
                                x.day === r.day ? { ...x, isClosed: v } : x,
                              ),
                            );
                          }}
                        />
                        Cerrado
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500">Inicio</span>
                      <select
                        value={r.startMin}
                        disabled={saving || r.isClosed}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setRows((prev) =>
                            prev.map((x) =>
                              x.day === r.day ? { ...x, startMin: v } : x,
                            ),
                          );
                        }}
                        className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm text-black outline-none focus:border-black disabled:opacity-50"
                      >
                        {HOUR_OPTS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <span className="text-xs text-neutral-500">Fin</span>
                      <select
                        value={r.endMin}
                        disabled={saving || r.isClosed}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setRows((prev) =>
                            prev.map((x) =>
                              x.day === r.day ? { ...x, endMin: v } : x,
                            ),
                          );
                        }}
                        className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm text-black outline-none focus:border-black disabled:opacity-50"
                      >
                        {HOUR_OPTS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <span className="ml-2 text-xs text-neutral-500">
                        {r.isClosed ? "Cerrado" : `${minToHHmm(r.startMin)} - ${minToHHmm(r.endMin)}`}
                      </span>
                    </div>
                  </div>

                  {rowInvalid ? (
                    <p className="mt-2 text-xs text-red-700">
                      Rango inválido: la hora de inicio debe ser menor que la hora de fin.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-500">
              Intervalos por hora. Para bloquear un día completo, marca “Cerrado”.
            </p>

            <button
              onClick={() => void guardar()}
              disabled={saving || invalid}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar horario"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}