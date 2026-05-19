"use client";

import { useMemo, useState } from "react";

import { useBarberoReservas } from "@/lib/useBarberoReservas";
import type { EstadoReserva } from "@/services/reservas.service";
import { cancelarReservaBarbero, completarReservaBarbero } from "@/services/reservas.service";

import ReservaModal from "@/componentes/publico/ReservaModal";

type ReservaItem = {
  id: string;

  clientName: string;
  clientEmail: string;
  clientPhone: string;

  startAt: string; // ISO
  endAt: string; // ISO
  status: EstadoReserva;

  priceFinal: string;
  durationFinalMin: number;
  comment?: string | null;

  // necesarios para reprogramar (slots)
  barberId: string;
  barberSlug: string;
  barberName: string;
  barberServiceId: string;
  serviceName: string;
};

function inicioFinHoyISO(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { from: start.toISOString(), to: end.toISOString() };
}

function isoToYYYYMMDD(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function badgeEstado(estado: EstadoReserva) {
  if (estado === "CANCELADA") return "bg-red-500/10 text-red-700 border-red-500/30";
  if (estado === "CONFIRMADA") return "bg-blue-500/10 text-blue-700 border-blue-500/30";
  return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
}

function toNumberCLP(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatCLP(n: number) {
  try {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
  } catch {
    return `$${n}`;
  }
}

export default function BarberoHomePage() {
  const { from, to } = useMemo(() => inicioFinHoyISO(), []);

  // Trae SOLO las de hoy
  const { data, loading, error, refetch } = useBarberoReservas({
    page: 1,
    pageSize: 50,
    status: undefined,
    q: undefined,
    from,
    to,
  });

  const reservasHoy: ReservaItem[] = useMemo(() => {
    const items = (data?.items ?? []) as any[];

    return items
      .map((r) => ({
        id: r.id,

        clientName: r.clientName ?? "—",
        clientEmail: r.clientEmail ?? "—",
        clientPhone: r.clientPhone ?? "—",

        startAt: r.startAt,
        endAt: r.endAt,
        status: r.status,

        priceFinal: String(r.priceFinal ?? "0"),
        durationFinalMin: Number(r.durationFinalMin ?? 0),
        comment: r.comment ?? null,

        barberId: r.barberId,
        barberSlug: r.barber?.slug ?? "",
        barberName: r.barber?.name ?? "—",
        barberServiceId: r.barberServiceId,
        serviceName: r.service?.name ?? "—",
      }))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [data]);

  const kpis = useMemo(() => {
    const total = reservasHoy.length;
    const confirmadas = reservasHoy.filter((r) => r.status === "CONFIRMADA").length;
    const completadas = reservasHoy.filter((r) => r.status === "COMPLETADA").length;
    const canceladas = reservasHoy.filter((r) => r.status === "CANCELADA").length;

    const ingresoHoy = reservasHoy
      .filter((r) => r.status === "COMPLETADA")
      .reduce((acc, r) => acc + toNumberCLP(r.priceFinal), 0);

    const proxima = [...reservasHoy]
      .filter((r) => r.status === "CONFIRMADA")
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];

    return { total, confirmadas, completadas, canceladas, ingresoHoy, proxima };
  }, [reservasHoy]);

  // banners
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  // acciones loading por reserva
  const [accionId, setAccionId] = useState<string | null>(null);

  // modal reprogramar
  const [reprogOpen, setReprogOpen] = useState(false);
  const [reprogTarget, setReprogTarget] = useState<ReservaItem | null>(null);

  // modal cancelar (custom)
  const [cancelTarget, setCancelTarget] = useState<ReservaItem | null>(null);

  function resetBanners() {
    setOkMsg("");
    setErrMsg("");
  }

  async function completar(reservaId: string) {
    resetBanners();
    try {
      setAccionId(reservaId);
      await completarReservaBarbero(reservaId);
      setOkMsg("Reserva completada ✔︎");
      await refetch();
    } catch (e: any) {
      setErrMsg(e?.message ? String(e.message) : "No se pudo completar la reserva.");
    } finally {
      setAccionId(null);
    }
  }

  function abrirReprogramar(r: ReservaItem) {
    resetBanners();
    if (!r.barberSlug) {
      setErrMsg("No se pudo reprogramar: falta barberSlug.");
      return;
    }
    setReprogTarget(r);
    setReprogOpen(true);
  }

  function cerrarReprogramar() {
    setReprogOpen(false);
    setReprogTarget(null);
  }

  function abrirCancelar(r: ReservaItem) {
    resetBanners();
    setCancelTarget(r);
  }

  function cerrarCancelar() {
    setCancelTarget(null);
  }

  async function confirmarCancelar() {
    if (!cancelTarget?.id) return;

    resetBanners();
    try {
      setAccionId(cancelTarget.id);
      await cancelarReservaBarbero(cancelTarget.id);
      setOkMsg("Reserva cancelada ✔︎");
      cerrarCancelar();
      await refetch();
    } catch (e: any) {
      setErrMsg(e?.message ? String(e.message) : "No se pudo cancelar la reserva.");
    } finally {
      setAccionId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-black">Resumen</h1>
        <p className="text-sm text-neutral-600">Reservas de hoy y acciones rápidas.</p>
      </div>

      {okMsg ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          {okMsg}
        </div>
      ) : null}

      {errMsg ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {errMsg}
        </div>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Reservas hoy</p>
          <p className="mt-1 text-2xl font-semibold text-black">{kpis.total}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Confirmadas</p>
          <p className="mt-1 text-2xl font-semibold text-black">{kpis.confirmadas}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Completadas</p>
          <p className="mt-1 text-2xl font-semibold text-black">{kpis.completadas}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Canceladas</p>
          <p className="mt-1 text-2xl font-semibold text-black">{kpis.canceladas}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Ingreso hoy</p>
          <p className="mt-1 text-2xl font-semibold text-black">{formatCLP(kpis.ingresoHoy)}</p>

          {kpis.proxima ? (
            <p className="mt-2 text-xs text-neutral-600">
              Próxima:{" "}
              <span className="font-medium text-black">{formatHora(kpis.proxima.startAt)}</span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-neutral-600">Sin próximas confirmadas</p>
          )}
        </div>
      </div>

      {/* Card principal */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-black">Reservas de hoy</h2>
            <p className="text-sm text-neutral-600">
              {new Date().toLocaleDateString("es-CL", { dateStyle: "full" })}
            </p>
          </div>

          <button
            onClick={() => void refetch()}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50"
          >
            Actualizar
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
              Cargando reservas...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : reservasHoy.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
              No tienes reservas hoy.
            </div>
          ) : (
            <div className="space-y-3">
              {reservasHoy.map((r) => {
                const busy = accionId === r.id;
                const puedeAccionar = r.status === "CONFIRMADA";

                return (
                  <div key={r.id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-black">
                          {formatHora(r.startAt)} – {formatHora(r.endAt)} • {r.serviceName}
                        </p>

                        <p className="mt-1 text-sm text-neutral-700">
                          <span className="text-neutral-500">Cliente:</span> {r.clientName}
                        </p>

                        <p className="text-xs text-neutral-500">{r.clientEmail}</p>
                        <p className="text-xs text-neutral-500">{r.clientPhone}</p>

                        {r.comment?.trim() ? (
                          <p className="mt-2 text-sm">
                            <span className="text-neutral-500">Comentario:</span>{" "}
                            <span className="text-neutral-800">{r.comment}</span>
                          </p>
                        ) : null}
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${badgeEstado(
                          r.status,
                        )}`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => completar(r.id)}
                        disabled={busy || !puedeAccionar}
                        className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                      >
                        {busy ? "Procesando..." : "Completar"}
                      </button>

                      <button
                        onClick={() => abrirReprogramar(r)}
                        disabled={busy || !puedeAccionar}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Reprogramar
                      </button>

                      <button
                        onClick={() => abrirCancelar(r)}
                        disabled={busy || !puedeAccionar}
                        className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Reprogramar (slots) */}
      {reprogOpen && reprogTarget ? (
        <ReservaModal
          open={reprogOpen}
          onClose={cerrarReprogramar}
          barberId={reprogTarget.barberId}
          barberSlug={reprogTarget.barberSlug}
          barberName={reprogTarget.barberName}
          barberServiceId={reprogTarget.barberServiceId}
          serviceName={reprogTarget.serviceName}
          durationMin={reprogTarget.durationFinalMin}
          mode="REPROGRAMAR"
          actor="BARBERO"
          reservaId={reprogTarget.id}
          initialDate={isoToYYYYMMDD(reprogTarget.startAt)}
          onSuccess={async (info) => {
            setOkMsg(info.mensaje || "Reserva reprogramada. Correo enviado ✔︎");
            setErrMsg("");
            cerrarReprogramar();
            await refetch();
          }}
        />
      ) : null}

      {/* Modal Confirmar cancelación (custom) */}
      {cancelTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-black">Cancelar reserva</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Esta acción no se puede deshacer. ¿Seguro que deseas cancelar la reserva de{" "}
              <span className="font-medium text-black">{cancelTarget.clientName}</span>?
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cerrarCancelar}
                disabled={accionId === cancelTarget.id}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Volver
              </button>

              <button
                type="button"
                onClick={() => void confirmarCancelar()}
                disabled={accionId === cancelTarget.id}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {accionId === cancelTarget.id ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
