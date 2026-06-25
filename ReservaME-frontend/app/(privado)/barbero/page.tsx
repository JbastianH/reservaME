"use client";

import { useMemo, useState } from "react";

import { useBarberoReservas } from "@/lib/useBarberoReservas";
import type { EstadoReserva } from "@/services/reservas.service";
import { cancelarReservaBarbero, completarReservaBarbero } from "@/services/reservas.service";

import ReservaModal from "@/componentes/publico/ReservaModal";

import { useBarberoMe } from "@/lib/useBarberoMe";
import BloqueosHorariosPanel from "@/componentes/barber-time-blocks/BloqueosHorariosPanel";
import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

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

  const {
    data: barberoActual,
    loading: loadingBarberoActual,
    error: errorBarberoActual,
  } = useBarberoMe();

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
  const [mostrarBloqueos, setMostrarBloqueos] = useState(false);

  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    title: "",
    message: "",
    variant: "success" as "success" | "error",
  });

  // acciones loading por reserva
  const [accionId, setAccionId] = useState<string | null>(null);

  // modal reprogramar
  const [reprogOpen, setReprogOpen] = useState(false);
  const [reprogTarget, setReprogTarget] = useState<ReservaItem | null>(null);

  // modal cancelar (custom)
  const [cancelTarget, setCancelTarget] = useState<ReservaItem | null>(null);
  const [completeTarget, setCompleteTarget] = useState<ReservaItem | null>(null);

  function mostrarFeedback(params: {
    title: string;
    message: string;
    variant: "success" | "error";
  }) {
    setFeedbackDialog({
      open: true,
      title: params.title,
      message: params.message,
      variant: params.variant,
    });
  }

  function abrirCompletar(r: ReservaItem) {
    setCompleteTarget(r);
  }

  function cerrarCompletar() {
    if (accionId === completeTarget?.id) return;
    setCompleteTarget(null);
  }

  async function confirmarCompletar() {
    if (!completeTarget?.id) return;

    try {
      setAccionId(completeTarget.id);
      await completarReservaBarbero(completeTarget.id);

      setCompleteTarget(null);

      mostrarFeedback({
        title: "Reserva completada",
        message: "La reserva fue marcada como completada correctamente.",
        variant: "success",
      });

      await refetch();
    } catch (e: any) {
      mostrarFeedback({
        title: "No se pudo completar",
        message: e?.message ? String(e.message) : "No se pudo completar la reserva.",
        variant: "error",
      });
    } finally {
      setAccionId(null);
    }
  }

  function abrirReprogramar(r: ReservaItem) {
    if (!r.barberSlug) {
      mostrarFeedback({
        title: "No se pudo reprogramar",
        message: "Falta el identificador público del barbero.",
        variant: "error",
      });
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
    setCancelTarget(r);
  }

  function cerrarCancelar() {
    setCancelTarget(null);
  }

  async function confirmarCancelar() {
    if (!cancelTarget?.id) return;

    try {
      setAccionId(cancelTarget.id);
      await cancelarReservaBarbero(cancelTarget.id);

      setCancelTarget(null);

      mostrarFeedback({
        title: "Reserva cancelada",
        message: "La reserva fue cancelada correctamente.",
        variant: "success",
      });

      await refetch();
    } catch (e: any) {
      mostrarFeedback({
        title: "No se pudo cancelar",
        message: e?.message ? String(e.message) : "No se pudo cancelar la reserva.",
        variant: "error",
      });
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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-black">Acciones rápidas</p>
          <p className="mt-1 text-xs text-neutral-500">
            Bloquea horarios específicos para que no puedan ser reservados.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarBloqueos((actual) => !actual)}
          className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          {mostrarBloqueos ? "Ocultar bloqueos" : "Gestionar bloqueos horarios"}
        </button>
      </div>

      {mostrarBloqueos ? (
        <div className="mt-4">
          {loadingBarberoActual ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
              Cargando perfil del barbero...
            </div>
          ) : errorBarberoActual ? (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              {errorBarberoActual}
            </div>
          ) : barberoActual ? (
            <BloqueosHorariosPanel
              ocultarSelectorBarbero
              barberIdInicial={barberoActual.id}
              barberSlugInicial={barberoActual.slug}
              titulo="Bloquear horarios"
            />
          ) : (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              No se pudo identificar el perfil del barbero.
            </div>
          )}
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
                        onClick={() => abrirCompletar(r)}
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
            cerrarReprogramar();

            mostrarFeedback({
              title: "Reserva reprogramada",
              message: info.mensaje || "La reserva fue reprogramada correctamente.",
              variant: "success",
            });

            await refetch();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(completeTarget)}
        title="Completar reserva"
        message={
          completeTarget
            ? `¿Seguro que quieres marcar como completada la reserva de ${completeTarget.clientName}?`
            : ""
        }
        confirmText={accionId === completeTarget?.id ? "Completando..." : "Sí, completar"}
        cancelText="Volver"
        variant="default"
        onConfirm={() => void confirmarCompletar()}
        onClose={cerrarCompletar}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancelar reserva"
        message={
          cancelTarget
            ? `Esta acción no se puede deshacer. ¿Seguro que deseas cancelar la reserva de ${cancelTarget.clientName}?`
            : ""
        }
        confirmText={accionId === cancelTarget?.id ? "Cancelando..." : "Sí, cancelar"}
        cancelText="Volver"
        variant="danger"
        onConfirm={() => void confirmarCancelar()}
        onClose={cerrarCancelar}
      />

      <FeedbackDialog
        open={feedbackDialog.open}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        variant={feedbackDialog.variant}
        onClose={() =>
          setFeedbackDialog((actual) => ({
            ...actual,
            open: false,
          }))
        }
      />
    </section>
  );
}
