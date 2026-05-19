"use client";

import { useEffect, useMemo, useState } from "react";

import { useBarberoReservas } from "@/lib/useBarberoReservas";
import type { EstadoReserva } from "@/services/reservas.service";
import { cancelarReservaBarbero, completarReservaBarbero } from "@/services/reservas.service";

// Reusar el modal de público en modo REPROGRAMAR
import ReservaModal from "@/componentes/publico/ReservaModal";

type ReservaItem = {
  id: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  servicio: string;
  startAt: string; // ISO
  endAt: string; // ISO
  estado: EstadoReserva;
  precioFinal: string;

  comment?: string | null;

  // para reprogramar con slots
  barberId: string;
  barberSlug: string;
  barberName: string;
  barberServiceId: string;
  serviceName: string;
  durationMin: number;
};

function formatearFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function badgeEstado(estado: EstadoReserva) {
  if (estado === "CANCELADA") return "bg-red-500/10 text-red-700 border-red-500/30";
  if (estado === "CONFIRMADA") return "bg-blue-500/10 text-blue-700 border-blue-500/30";
  return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
}

type FiltroFecha = "HOY" | "PROX_7" | "TODAS";

function rangoFechas(fecha: FiltroFecha): { from?: string; to?: string } {
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000);

  if (fecha === "HOY") {
    return { from: inicioHoy.toISOString(), to: finHoy.toISOString() };
  }

  if (fecha === "PROX_7") {
    const fin7 = new Date(inicioHoy.getTime() + 7 * 24 * 60 * 60 * 1000);
    return { from: inicioHoy.toISOString(), to: fin7.toISOString() };
  }

  return {};
}

function isoToISODate(iso: string) {
  // YYYY-MM-DD en zona local del navegador
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

export default function BarberoReservasPage() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoReserva | "TODOS">("TODOS");
  const [fecha, setFecha] = useState<FiltroFecha>("PROX_7");

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Acciones
  const [accionId, setAccionId] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  // reprogramación con slots (usando ReservaModal)
  const [reprogOpen, setReprogOpen] = useState(false);
  const [reprogTarget, setReprogTarget] = useState<ReservaItem | null>(null);

  // NUEVO: confirmación custom para cancelar
  const [cancelTarget, setCancelTarget] = useState<ReservaItem | null>(null);

  // Cuando cambian filtros, vuelve a página 1
  useEffect(() => {
    setPage(1);
  }, [q, estado, fecha]);

  const { from, to } = useMemo(() => rangoFechas(fecha), [fecha]);

  const { data, loading, error, refetch } = useBarberoReservas({
    page,
    pageSize,
    status: estado === "TODOS" ? undefined : estado,
    q: q.trim() ? q.trim() : undefined,
    from,
    to,
  });

  const total = data?.total ?? 0;
  const pageBackend = data?.page ?? page;
  const pageSizeBackend = data?.pageSize ?? pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSizeBackend));

  const reservas: ReservaItem[] = useMemo(() => {
    const items = data?.items ?? [];

    return items.map((r: any) => ({
      id: r.id,
      clienteNombre: r.clientName,
      clienteEmail: r.clientEmail,
      clienteTelefono: r.clientPhone,
      servicio: r.service?.name ?? "—",
      startAt: r.startAt,
      endAt: r.endAt,
      estado: r.status,
      precioFinal: r.priceFinal,

      comment: r.comment ?? null,

      // info necesaria para reusar disponibilidad + header del modal
      barberId: r.barberId,
      barberSlug: r.barber?.slug ?? "",
      barberName: r.barber?.name ?? "—",
      barberServiceId: r.barberServiceId,
      serviceName: r.service?.name ?? "—",
      durationMin: r.durationFinalMin ?? 0,
    }));
  }, [data]);

  async function handleCompletar(reservaId: string) {
    try {
      setMensajeOk("");
      setMensajeError("");
      setAccionId(reservaId);

      await completarReservaBarbero(reservaId);

      setMensajeOk("Reserva completada ✔︎");
      await refetch();
    } catch {
      setMensajeError("No se pudo completar la reserva.");
    } finally {
      setAccionId(null);
    }
  }

  // NUEVO: flujo cancelar con modal custom
  function abrirCancelar(r: ReservaItem) {
    setMensajeOk("");
    setMensajeError("");
    setCancelTarget(r);
  }

  function cerrarCancelar() {
    setCancelTarget(null);
  }

  async function confirmarCancelar() {
    if (!cancelTarget) return;

    try {
      setMensajeOk("");
      setMensajeError("");
      setAccionId(cancelTarget.id);

      await cancelarReservaBarbero(cancelTarget.id);

      setMensajeOk("Reserva cancelada ✔︎");
      cerrarCancelar();
      await refetch();
    } catch {
      setMensajeError("No se pudo cancelar la reserva.");
    } finally {
      setAccionId(null);
    }
  }

  function abrirReprogramar(r: ReservaItem) {
    setMensajeOk("");
    setMensajeError("");
    setReprogTarget(r);
    setReprogOpen(true);
  }

  function cerrarReprogramar() {
    setReprogOpen(false);
    setReprogTarget(null);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Mis reservas</h1>
        <p className="mt-1 text-sm text-neutral-600">Filtra y revisa tus reservas del día a día.</p>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">Buscar</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre, correo o servicio..."
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none placeholder:text-neutral-400 focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoReserva | "TODOS")}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
            >
              <option value="TODOS">Todos</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="COMPLETADA">Completada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">Fecha</label>
            <select
              value={fecha}
              onChange={(e) => setFecha(e.target.value as FiltroFecha)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
            >
              <option value="HOY">Hoy</option>
              <option value="PROX_7">Próximos 7 días</option>
              <option value="TODAS">Todas</option>
            </select>
          </div>
        </div>
      </div>

      {/* OK / Error message */}
      {!loading && !error && mensajeOk ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          {mensajeOk}
        </div>
      ) : null}

      {!loading && !error && mensajeError ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {mensajeError}
        </div>
      ) : null}

      {/* Loading / Error (hook) */}
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

      {/* Desktop: tabla */}
      {!loading && !error ? (
        <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-600">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservas.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-500" colSpan={6}>
                    No hay reservas con esos filtros.
                  </td>
                </tr>
              ) : (
                reservas.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-black">{r.clienteNombre}</div>
                      <div className="text-xs text-neutral-500">{r.clienteEmail}</div>
                      <div className="text-xs text-neutral-500">{r.clienteTelefono}</div>
                      {r.comment?.trim() ? (
                        <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700">
                          <span className="font-medium text-neutral-800">Comentario:</span>{" "}
                          <span>{r.comment}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-neutral-800">{r.servicio}</td>
                    <td className="px-4 py-3 text-neutral-800">{formatearFecha(r.startAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${badgeEstado(
                          r.estado,
                        )}`}
                      >
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-800">${r.precioFinal}</td>
                    <td className="px-4 py-3">
                      {r.estado === "CONFIRMADA" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => void handleCompletar(r.id)}
                            disabled={accionId === r.id}
                            className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                          >
                            {accionId === r.id ? "Completando..." : "Completar"}
                          </button>

                          <button
                            onClick={() => abrirReprogramar(r)}
                            disabled={accionId === r.id}
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-black hover:bg-neutral-50 disabled:opacity-50"
                          >
                            Reprogramar
                          </button>

                          <button
                            onClick={() => abrirCancelar(r)}
                            disabled={accionId === r.id}
                            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Mobile: cards */}
      {!loading && !error ? (
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {reservas.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
              No hay reservas con esos filtros.
            </div>
          ) : (
            reservas.map((r) => (
              <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-black">{r.clienteNombre}</p>
                    <p className="text-xs text-neutral-500">{r.clienteEmail}</p>
                    <p className="text-xs text-neutral-500">{r.clienteTelefono}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${badgeEstado(
                      r.estado,
                    )}`}
                  >
                    {r.estado}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-neutral-700">
                  <p>
                    <span className="text-neutral-500">Servicio:</span> {r.servicio}
                  </p>
                  <p>
                    <span className="text-neutral-500">Inicio:</span> {formatearFecha(r.startAt)}
                  </p>
                  <p>
                    <span className="text-neutral-500">Precio: $</span> {r.precioFinal}
                  </p>

                  {r.comment?.trim() ? (
                      <p>
                        <span className="text-neutral-500">Comentario:</span>{" "}
                        <span className="text-neutral-700">{r.comment}</span>
                      </p>
                    ) : null}
                </div>

                {r.estado === "CONFIRMADA" ? (
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <button
                      onClick={() => void handleCompletar(r.id)}
                      disabled={accionId === r.id}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
                    >
                      {accionId === r.id ? "Completando..." : "Completar reserva"}
                    </button>

                    <button
                      onClick={() => abrirReprogramar(r)}
                      disabled={accionId === r.id}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
                    >
                      Reprogramar
                    </button>

                    <button
                      onClick={() => abrirCancelar(r)}
                      disabled={accionId === r.id}
                      className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Paginación */}
      {!loading && !error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageBackend <= 1}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
          >
            Anterior
          </button>

          <p className="text-sm text-neutral-600">
            Página <span className="font-medium text-black">{pageBackend}</span> de{" "}
            <span className="font-medium text-black">{totalPages}</span>
          </p>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={pageBackend >= totalPages}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      ) : null}

      {/* Reprogramar usando ReservaModal (slots) */}
      {reprogOpen && reprogTarget ? (
        <ReservaModal
          open={reprogOpen}
          onClose={cerrarReprogramar}
          barberId={reprogTarget.barberId}
          barberSlug={reprogTarget.barberSlug}
          barberName={reprogTarget.barberName}
          barberServiceId={reprogTarget.barberServiceId}
          serviceName={reprogTarget.serviceName}
          durationMin={reprogTarget.durationMin}
          mode="REPROGRAMAR"
          actor="BARBERO"
          reservaId={reprogTarget.id}
          initialDate={isoToISODate(reprogTarget.startAt)}
          onSuccess={async (info) => {
            setMensajeOk(info.mensaje); // "Reserva reprogramada. Correo enviado ✔︎"
            setMensajeError("");
            cerrarReprogramar();
            await refetch();
          }}
        />
      ) : null}

      {/* Modal confirmación cancelar (custom) */}
      {cancelTarget ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-black">Cancelar reserva</h3>

            <p className="mt-2 text-sm text-neutral-600">
              Esta acción no se puede deshacer. ¿Seguro que deseas cancelar la reserva de{" "}
              <span className="font-medium text-black">{cancelTarget.clienteNombre}</span>?
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
