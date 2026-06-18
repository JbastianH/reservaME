"use client";

import { useMemo, useState } from "react";
import { useAdminReservas } from "@/lib/useAdminReservas";
import type { ReservaEstado } from "@/services/admin-reservas.service";
import { completarReservaAdmin } from "@/services/admin-reservas.service";

import { cancelarReservaAdmin } from "@/services/reservas.service";

import { useAdminBarberos } from "@/lib/useAdminBarberos";
import ReservaModal from "@/componentes/publico/ReservaModal";
import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

function formatCLP(value: unknown) {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("es-CL")}`;
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function pillEstado(estado: ReservaEstado) {
  switch (estado) {
    case "CONFIRMADA":
      return "bg-sky-500/10 text-sky-700 border-sky-500/30";
    case "COMPLETADA":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
    case "CANCELADA":
      return "bg-neutral-500/10 text-neutral-700 border-neutral-500/30";
    default:
      return "bg-neutral-500/10 text-neutral-700 border-neutral-500/30";
  }
}

function isoToYYYYMMDD(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function safeComment(value: any) {
  const s = typeof value === "string" ? value.trim() : "";
  return s ? s : null;
}

function truncate(s: string, max = 80) {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

export default function AdminReservasPage() {
  // filtros
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"" | ReservaEstado>("");
  const [barberId, setBarberId] = useState("");

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(() => {
    return {
      page,
      pageSize,
      q: q.trim() ? q.trim() : undefined,
      status: estado || undefined,
      barberId: barberId || undefined,
    };
  }, [page, q, estado, barberId]);

  const { data, loading, error, refetch } = useAdminReservas(params);

  // barberos (para filtro + para resolver slug)
  const { data: barberosData } = useAdminBarberos();
  const barberos = (barberosData ?? []) as any[];

  const [accionId, setAccionId] = useState<string | null>(null);

  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    title: "",
    message: "",
    variant: "success" as "success" | "error",
  });

  // modal reprogramación (slots)
  const [reprogOpen, setReprogOpen] = useState(false);
  const [reprogTarget, setReprogTarget] = useState<any | null>(null);

  // modal confirmación cancelar (custom)
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [completeTarget, setCompleteTarget] = useState<any | null>(null);

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
  function onChangeFiltro() {
    setPage(1);
  }

  function abrirCompletar(r: any) {
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

      await completarReservaAdmin(completeTarget.id);

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

  function resolverSlugDeReserva(r: any) {
    // 1) si viene en la reserva (ideal)
    const slugDirecto = r?.barber?.slug;
    if (slugDirecto) return slugDirecto;

    // 2) si no viene, lo busca en barberos (useAdminBarberos)
    const id = r?.barber?.id ?? r?.barberId;
    if (!id) return "";

    const b = barberos.find((x) => x.id === id);
    return b?.slug ?? "";
  }

  function abrirReprogramar(r: any) {
    const slug = resolverSlugDeReserva(r);
    const barberIdReal = r?.barber?.id ?? r?.barberId ?? "";

    if (!slug) {
      mostrarFeedback({
        title: "No se pudo reprogramar",
        message: "Falta el identificador público del barbero en los datos.",
        variant: "error",
      });
      return;
    }

    setReprogTarget({
      ...r,
      barberSlug: slug,
      barberId: barberIdReal,
    });

    setReprogOpen(true);
  }

  function cerrarReprogramar() {
    setReprogOpen(false);
    setReprogTarget(null);
  }

  function abrirCancelar(r: any) {
    setCancelTarget(r);
  }

  function cerrarCancelar() {
    if (accionId === cancelTarget?.id) return;
    setCancelTarget(null);
  }

  async function confirmarCancelar() {
    if (!cancelTarget?.id) return;

    try {
      setAccionId(cancelTarget.id);

      await cancelarReservaAdmin(cancelTarget.id);

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

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Reservas</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Listado global con filtros por barbero, estado y búsqueda.
          </p>
        </div>
      </div>

      {!loading && error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Filtros */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-neutral-600">Buscar</label>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                onChangeFiltro();
              }}
              placeholder="Cliente, correo, servicio..."
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none placeholder:text-neutral-400 focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">Barbero</label>
            <select
              value={barberId}
              onChange={(e) => {
                setBarberId(e.target.value);
                onChangeFiltro();
              }}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
            >
              <option value="">Todos</option>
              {barberos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">Estado</label>
            <select
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value as any);
                onChangeFiltro();
              }}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
            >
              <option value="">Todos</option>
              <option value="CONFIRMADA">CONFIRMADA</option>
              <option value="COMPLETADA">COMPLETADA</option>
              <option value="CANCELADA">CANCELADA</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          Cargando reservas...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-600">
                <tr>
                  <th className="px-7 py-7">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Barbero</th>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Comentario</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-500" colSpan={8}>
                      No hay reservas con esos filtros.
                    </td>
                  </tr>
                ) : (
                  items.map((r: any) => {
                    const busy = accionId === r.id;
                    const disabledAcciones = busy || r.status !== "CONFIRMADA";
                    const comment = safeComment(r.comment);

                    return (
                      <tr key={r.id} className="border-t border-neutral-100">
                        <td className="px-4 py-3 text-neutral-800">{formatDateTime(r.startAt)}</td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-black">{r.clientName ?? "—"}</div>
                          <div className="text-xs text-neutral-500">{r.clientEmail ?? ""}</div>
                          <div className="text-xs text-neutral-500">{r.clientPhone ?? ""}</div>
                        </td>

                        <td className="px-4 py-3 text-neutral-800">{r.barber?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-neutral-800">{r.service?.name ?? "—"}</td>

                        <td className="px-4 py-3 text-neutral-700">
                          {comment ? (
                            <span title={comment} className="block max-w-[280px] truncate">
                              {truncate(comment, 90)}
                            </span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-neutral-800">{formatCLP(r.priceFinal)}</td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${pillEstado(
                              r.status,
                            )}`}
                          >
                            {r.status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => abrirCompletar(r)}
                              disabled={disabledAcciones}
                              className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                            >
                              {busy ? "Procesando..." : "Completar"}
                            </button>

                            <button
                              onClick={() => abrirReprogramar(r)}
                              disabled={disabledAcciones}
                              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
                            >
                              Reprogramar
                            </button>

                            <button
                              onClick={() => abrirCancelar(r)}
                              disabled={disabledAcciones}
                              className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                No hay reservas con esos filtros.
              </div>
            ) : (
              items.map((r: any) => {
                const busy = accionId === r.id;
                const disabledAcciones = busy || r.status !== "CONFIRMADA";
                const comment = safeComment(r.comment);

                return (
                  <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-black">{r.clientName ?? "—"}</p>
                        <p className="truncate text-xs text-neutral-500">{r.clientEmail ?? "—"}</p>
                        <p className="truncate text-xs text-neutral-500">{r.clientPhone ?? ""}</p>
                        <p className="mt-2 text-xs text-neutral-500">{formatDateTime(r.startAt)}</p>
                        <p className="mt-1 text-xs text-neutral-700">
                          {r.barber?.name ?? "—"} • {r.service?.name ?? "—"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${pillEstado(
                          r.status,
                        )}`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-neutral-700">
                      <p>
                        <span className="text-neutral-500">Total:</span> {formatCLP(r.priceFinal)}
                      </p>

                      <p className="mt-2">
                        <span className="text-neutral-500">Comentario:</span>{" "}
                        {comment ? (
                          <span title={comment} className="text-neutral-800">
                            {truncate(comment, 140)}
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2">
                      <button
                        onClick={() => abrirCompletar(r)}
                        disabled={disabledAcciones}
                        className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                      >
                        {busy ? "Procesando..." : "Completar"}
                      </button>

                      <button
                        onClick={() => abrirReprogramar(r)}
                        disabled={disabledAcciones}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Reprogramar
                      </button>

                      <button
                        onClick={() => abrirCancelar(r)}
                        disabled={disabledAcciones}
                        className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Página <span className="font-medium text-black">{data?.page ?? 1}</span> de{" "}
              <span className="font-medium text-black">{totalPages}</span> • Total:{" "}
              <span className="font-medium text-black">{data?.total ?? 0}</span>
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      ) : null}

      {/* Modal Reprogramar con slots */}
      {reprogOpen && reprogTarget ? (
        <ReservaModal
          open={reprogOpen}
          onClose={cerrarReprogramar}
          barberId={reprogTarget.barber?.id ?? reprogTarget.barberId ?? ""}
          barberSlug={reprogTarget.barberSlug ?? ""}
          barberName={reprogTarget.barber?.name ?? "—"}
          barberServiceId={reprogTarget.barberServiceId ?? ""}
          serviceName={reprogTarget.service?.name ?? "—"}
          durationMin={reprogTarget.durationFinalMin ?? 0}
          mode="REPROGRAMAR"
          actor="ADMIN"
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
            ? `¿Seguro que quieres marcar como completada la reserva de ${
                completeTarget.clientName ?? "este cliente"
              }?`
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
            ? `Esta acción no se puede deshacer. ¿Seguro que deseas cancelar la reserva de ${
                cancelTarget.clientName ?? "este cliente"
              }?`
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
