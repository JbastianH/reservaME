"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarberTimeBlock,
  construirStartAtIsoDesdeFechaHoraLocal,
  crearBarberTimeBlock,
  eliminarBarberTimeBlock,
  listarBarberTimeBlocks,
  obtenerDisponibilidadPublica,
} from "@/services/barber-time-blocks.service";
import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

type BarberoOption = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  barberos?: BarberoOption[];
  barberIdInicial?: string;
  barberSlugInicial?: string;
  ocultarSelectorBarbero?: boolean;
  titulo?: string;
};

function obtenerFechaLocalHoy() {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function construirRangoDiaLocal(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  const desde = new Date(year, month - 1, day, 0, 0, 0, 0);
  const hasta = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

  return {
    from: desde.toISOString(),
    to: hasta.toISOString(),
  };
}

function formatearHoraChile(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatearFechaChile(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default function BloqueosHorariosPanel({
  barberos = [],
  barberIdInicial,
  barberSlugInicial,
  ocultarSelectorBarbero = false,
  titulo = "Bloqueos horarios",
}: Props) {
  const [barberId, setBarberId] = useState(barberIdInicial ?? "");
  const [barberSlug, setBarberSlug] = useState(barberSlugInicial ?? "");
  const [date, setDate] = useState(obtenerFechaLocalHoy());
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [taken, setTaken] = useState<string[]>([]);
  const [bloques, setBloques] = useState<BarberTimeBlock[]>([]);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);
  const [loadingBloques, setLoadingBloques] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [bloqueoAEliminar, setBloqueoAEliminar] = useState<BarberTimeBlock | null>(null);

  const [eliminando, setEliminando] = useState(false);

  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    title: "",
    message: "",
    variant: "success" as "success" | "error",
  });

  const barberoSeleccionado = useMemo(() => {
    return barberos.find((barbero) => barbero.id === barberId);
  }, [barberos, barberId]);

  useEffect(() => {
    if (ocultarSelectorBarbero) {
      setBarberId(barberIdInicial ?? "");
      setBarberSlug(barberSlugInicial ?? "");
      return;
    }

    if (!barberId && barberos.length > 0) {
      const primerBarbero = barberos[0];

      setBarberId(primerBarbero.id);
      setBarberSlug(primerBarbero.slug);
    }
  }, [ocultarSelectorBarbero, barberId, barberIdInicial, barberSlugInicial, barberos]);

  useEffect(() => {
    if (!ocultarSelectorBarbero && barberoSeleccionado) {
      setBarberSlug(barberoSeleccionado.slug);
      setTime("");
    }
  }, [ocultarSelectorBarbero, barberoSeleccionado]);

  const cargarDisponibilidad = useCallback(async () => {
    if (!barberSlug) {
      setSlots([]);
      setTaken([]);
      return;
    }

    setLoadingDisponibilidad(true);
    setFeedback("");

    try {
      const data = await obtenerDisponibilidadPublica({
        slug: barberSlug,
        date,
      });

      setSlots(data.slots ?? []);
      setTaken(data.taken ?? []);
      setTime("");
    } catch (error) {
      setSlots([]);
      setTaken([]);
      setFeedback(error instanceof Error ? error.message : "No se pudo cargar la disponibilidad.");
    } finally {
      setLoadingDisponibilidad(false);
    }
  }, [barberSlug, date]);

  const cargarBloques = useCallback(async () => {
    setLoadingBloques(true);
    setFeedback("");

    try {
      const rango = construirRangoDiaLocal(date);

      const data = await listarBarberTimeBlocks({
        barberId: barberId || undefined,
        from: rango.from,
        to: rango.to,
      });

      setBloques(data);
    } catch (error) {
      setBloques([]);
      setFeedback(error instanceof Error ? error.message : "No se pudieron cargar los bloqueos.");
    } finally {
      setLoadingBloques(false);
    }
  }, [barberId, date]);

  useEffect(() => {
    void cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  useEffect(() => {
    void cargarBloques();
  }, [cargarBloques]);

  async function crearBloqueo() {
    setSaving(true);
    setFeedback("");

    try {
      if (!ocultarSelectorBarbero && !barberId) {
        setFeedback("Debes seleccionar un barbero.");
        return;
      }

      if (!time) {
        setFeedback("Debes seleccionar una hora disponible.");
        return;
      }

      const startAtIso = construirStartAtIsoDesdeFechaHoraLocal({
        date,
        time,
      });

      await crearBarberTimeBlock({
        barberId: ocultarSelectorBarbero ? undefined : barberId,
        startAtIso,
        reason: reason.trim() || undefined,
      });

      setReason("");
      setTime("");
      setFeedback("Bloqueo creado correctamente.");

      await cargarDisponibilidad();
      await cargarBloques();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo crear el bloqueo.");
    } finally {
      setSaving(false);
    }
  }

  function pedirEliminarBloqueo(bloque: BarberTimeBlock) {
    setBloqueoAEliminar(bloque);
  }

  function cerrarConfirmacionEliminar() {
    if (eliminando) return;
    setBloqueoAEliminar(null);
  }

  async function confirmarEliminarBloqueo() {
    if (!bloqueoAEliminar) return;

    setEliminando(true);

    try {
      await eliminarBarberTimeBlock(bloqueoAEliminar.id);

      setBloqueoAEliminar(null);

      setFeedbackDialog({
        open: true,
        title: "Bloqueo eliminado",
        message: "El bloqueo horario fue eliminado correctamente.",
        variant: "success",
      });

      await cargarDisponibilidad();
      await cargarBloques();
    } catch (error) {
      setFeedbackDialog({
        open: true,
        title: "No se pudo eliminar",
        message: error instanceof Error ? error.message : "No se pudo eliminar el bloqueo horario.",
        variant: "error",
      });
    } finally {
      setEliminando(false);
    }
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-black">{titulo}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Selecciona una fecha y bloquea una hora disponible para ese día.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {!ocultarSelectorBarbero && (
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Barbero</label>

            <select
              value={barberId}
              onChange={(event) => {
                const nuevoBarberId = event.target.value;
                const nuevoBarbero = barberos.find((barbero) => barbero.id === nuevoBarberId);

                setBarberId(nuevoBarberId);
                setBarberSlug(nuevoBarbero?.slug ?? "");
                setTime("");
              }}
              className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm transition outline-none focus:border-black"
            >
              {barberos.length === 0 && <option value="">Sin barberos disponibles</option>}

              {barberos.map((barbero) => (
                <option key={barbero.id} value={barbero.id}>
                  {barbero.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Fecha</label>

          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setTime("");
            }}
            className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-sm text-black transition outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">Motivo</label>

          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ej: Trámite personal"
            className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-sm text-black transition outline-none focus:border-black"
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-3 block text-sm font-medium text-neutral-700">Hora</label>

        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
          {loadingDisponibilidad ? (
            <p className="text-sm text-neutral-500">Cargando disponibilidad...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay horarios disponibles para esta fecha.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {slots.map((slot) => {
                const ocupado = taken.includes(slot);
                const seleccionado = time === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setTime(slot)}
                    className={[
                      "h-12 rounded-xl border text-sm font-medium transition",
                      ocupado
                        ? "cursor-not-allowed border-neutral-200 bg-white text-neutral-400"
                        : seleccionado
                          ? "border-black bg-black text-white"
                          : "border-neutral-300 bg-white text-black hover:border-black",
                    ].join(" ")}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={crearBloqueo}
          disabled={saving || !time}
          className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          {saving ? "Creando..." : "Crear bloqueo"}
        </button>

        <button
          type="button"
          onClick={() => {
            void cargarDisponibilidad();
            void cargarBloques();
          }}
          disabled={loadingDisponibilidad || loadingBloques}
          className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400"
        >
          Actualizar
        </button>
      </div>

      {feedback && (
        <p className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {feedback}
        </p>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-black">Bloqueos del día</h3>

        {loadingBloques ? (
          <p className="mt-3 text-sm text-neutral-500">Cargando bloqueos...</p>
        ) : bloques.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            No hay bloqueos registrados para esta fecha.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 bg-neutral-50 px-4 py-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              <span>Fecha</span>
              <span>Horario</span>
              <span>Motivo</span>
              <span>Acción</span>
            </div>

            {bloques.map((bloque) => (
              <div
                key={bloque.id}
                className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3 border-t border-neutral-200 px-4 py-3 text-sm"
              >
                <span className="text-neutral-700">{formatearFechaChile(bloque.startAt)}</span>

                <span className="font-medium text-black">
                  {formatearHoraChile(bloque.startAt)} - {formatearHoraChile(bloque.endAt)}
                </span>

                <span className="text-neutral-600">{bloque.reason || "Sin motivo"}</span>

                <button
                  type="button"
                  onClick={() => pedirEliminarBloqueo(bloque)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(bloqueoAEliminar)}
        title="Eliminar bloqueo horario"
        message={
          bloqueoAEliminar
            ? `¿Seguro que quieres eliminar el bloqueo de ${formatearHoraChile(
                bloqueoAEliminar.startAt,
              )} a ${formatearHoraChile(bloqueoAEliminar.endAt)}?`
            : ""
        }
        confirmText={eliminando ? "Eliminando..." : "Sí, eliminar"}
        cancelText="Volver"
        variant="danger"
        onConfirm={() => void confirmarEliminarBloqueo()}
        onClose={cerrarConfirmacionEliminar}
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
