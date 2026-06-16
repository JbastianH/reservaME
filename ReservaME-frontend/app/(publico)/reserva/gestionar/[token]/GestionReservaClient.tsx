"use client";

import { useEffect, useMemo, useState } from "react";

import {
  cancelarGestionReserva,
  getGestionReserva,
  reprogramarGestionReserva,
  type ReservaGestionPublicaResponse,
} from "@/services/reserva-gestion-publica.service";

import {
  obtenerDisponibilidadPublica,
  type DisponibilidadPublicaResponse,
} from "@/services/disponibilidad-publica.service";

import PoliticaCancelacion from "@/componentes/publico/PoliticaCancelacion";
import ConfirmDialog from "@/componentes/ui/ConfirmDialog";

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildLocalDateTimeISO(dateStr: string, timeStr: string) {
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return d.toISOString();
}

function formatDateTimeLocal(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-CL", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatCLP(value: string) {
  const n = Number(value);

  if (!Number.isFinite(n)) return value;

  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

function obtenerMensajeError(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}

type SuccessAction = null | { type: "CANCELADA" } | { type: "REPROGRAMADA"; startAt: string };

type ConfirmState =
  | { open: false }
  | { open: true; kind: "cancelar" }
  | { open: true; kind: "reprogramar"; date: string; slot: string };

type Props = {
  token: string;
  secondaryColor?: string;
  fontFamilyTenant?: string;
  cancellationHoursBefore?: number;
};

export default function GestionReservaClient({
  token,
  secondaryColor = "#ffffff",
  fontFamilyTenant,
  cancellationHoursBefore = 3,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReservaGestionPublicaResponse | null>(null);

  const [date, setDate] = useState<string>(todayISODate());
  const [disp, setDisp] = useState<DisponibilidadPublicaResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState("");

  const [politicaAceptada, setPoliticaAceptada] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [finalAction, setFinalAction] = useState<SuccessAction>(null);

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr("");
      setOk("");
      setFinalAction(null);

      try {
        const r = await getGestionReserva(token);
        setData(r);

        const start = new Date(r.reserva.startAt);
        const yyyy = start.getFullYear();
        const mm = String(start.getMonth() + 1).padStart(2, "0");
        const dd = String(start.getDate()).padStart(2, "0");

        setDate(`${yyyy}-${mm}-${dd}`);
      } catch (e) {
        setErr(obtenerMensajeError(e, "No se pudo cargar la gestión de la reserva."));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token]);

  useEffect(() => {
    if (!data) return;
    if (finalAction) return;

    async function loadSlots() {
      setLoadingSlots(true);
      setErr("");
      setOk("");
      setDisp(null);
      setSlot("");

      try {
        const r = await obtenerDisponibilidadPublica({
          slug: data!.reserva.barber.slug,
          date,
        });

        setDisp(r);
      } catch (e) {
        setErr(obtenerMensajeError(e, "No se pudo cargar disponibilidad."));
      } finally {
        setLoadingSlots(false);
      }
    }

    void loadSlots();
  }, [data, date, finalAction]);

  const slotsDisponibles = useMemo(() => {
    if (!disp || disp.closed) return [];

    const taken = new Set(disp.taken ?? []);

    return (disp.slots ?? []).map((s) => ({
      time: s,
      disabled: taken.has(s),
    }));
  }, [disp]);

  const isExpired = useMemo(() => {
    if (!data) return false;

    const exp = new Date(data.token.expiresAt).getTime();

    return exp <= Date.now();
  }, [data]);

  const isUsed = useMemo(() => {
    if (!data) return false;

    return Boolean(data.token.usedAt);
  }, [data]);

  const canAct = useMemo(() => {
    if (!data) return false;
    if (busy) return false;
    if (finalAction) return false;
    if (isExpired) return false;
    if (isUsed) return false;
    if (data.reserva.status !== "CONFIRMADA") return false;

    return true;
  }, [data, busy, isExpired, isUsed, finalAction]);

  async function doCancelar() {
    setErr("");
    setOk("");

    if (!canAct) {
      setErr(
        "Este enlace no permite cancelar. Puede haber expirado, ya fue utilizado o la reserva ya no está confirmada.",
      );
      return;
    }

    try {
      setBusy(true);

      const r = await cancelarGestionReserva(token);

      setFinalAction({ type: "CANCELADA" });
      setOk(r.mensaje ?? "Reserva cancelada correctamente.");
    } catch (e) {
      setErr(obtenerMensajeError(e, "No se pudo cancelar."));
    } finally {
      setBusy(false);
    }
  }

  async function doReprogramar(dateStr: string, slotStr: string) {
    setErr("");
    setOk("");

    if (!canAct) {
      setErr(
        "Este enlace no permite reprogramar. Puede haber expirado, ya fue utilizado o la reserva ya no está confirmada.",
      );
      return;
    }

    if (!slotStr) {
      setErr("Selecciona una hora.");
      return;
    }

    if (!politicaAceptada) {
      setErr("Debes aceptar la política de cancelación.");
      return;
    }

    try {
      setBusy(true);

      const startAtISO = buildLocalDateTimeISO(dateStr, slotStr);

      const r = await reprogramarGestionReserva(token, startAtISO);

      setFinalAction({
        type: "REPROGRAMADA",
        startAt: startAtISO,
      });

      setOk(r.mensaje ?? "Reserva reprogramada correctamente.");

      setData((prev) => {
        if (!prev) return prev;

        const startAt = new Date(startAtISO);
        const endAt = new Date(
          startAt.getTime() + prev.reserva.durationFinalMin * 60 * 1000,
        ).toISOString();

        return {
          ...prev,
          reserva: {
            ...prev.reserva,
            startAt: startAt.toISOString(),
            endAt,
          },
        };
      });
    } catch (e) {
      setErr(obtenerMensajeError(e, "No se pudo reprogramar."));
    } finally {
      setBusy(false);
    }
  }

  function openConfirmCancelar() {
    setConfirm({
      open: true,
      kind: "cancelar",
    });
  }

  function openConfirmReprogramar() {
    if (!slot) {
      setErr("Selecciona una hora antes de reprogramar.");
      return;
    }

    if (!politicaAceptada) {
      setErr("Debes aceptar la política de cancelación para continuar.");
      return;
    }

    setConfirm({
      open: true,
      kind: "reprogramar",
      date,
      slot,
    });
  }

  async function onConfirmAction() {
    if (!confirm.open) return;

    const current = confirm;

    setConfirm({ open: false });

    if (current.kind === "cancelar") {
      await doCancelar();
      return;
    }

    if (current.kind === "reprogramar") {
      await doReprogramar(current.date, current.slot);
    }
  }

  const confirmTitle =
    confirm.open && confirm.kind === "cancelar"
      ? "Confirmar cancelación"
      : "Confirmar reprogramación";

  const confirmMessage =
    confirm.open && confirm.kind === "cancelar"
      ? "¿Seguro que quieres cancelar tu reserva? Esta acción no se puede deshacer."
      : confirm.open && confirm.kind === "reprogramar"
        ? `Vas a reprogramar tu reserva para ${confirm.date} a las ${confirm.slot}. ¿Confirmas el cambio?`
        : "";

  if (loading) {
    return (
      <div
        className="rounded-[2rem] border bg-white/10 p-6 text-sm text-white/60 shadow-2xl backdrop-blur-sm"
        style={{ borderColor: `${secondaryColor}55` }}
      >
        Cargando reserva...
      </div>
    );
  }

  if (err && !data) {
    return (
      <div className="rounded-[2rem] border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-100 shadow-2xl backdrop-blur-sm">
        {err}
      </div>
    );
  }

  if (!data) return null;

  return (
    <section className="space-y-6 font-sans">
      <ConfirmDialog
        open={confirm.open}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Confirmar"
        cancelText="Volver"
        loading={busy}
        variant={confirm.open && confirm.kind === "cancelar" ? "danger" : "default"}
        onConfirm={() => void onConfirmAction()}
        onClose={() => setConfirm({ open: false })}
      />

      <div>
        <p
          className="text-xs font-semibold tracking-[0.35em] uppercase"
          style={{
            color: secondaryColor,
            fontFamily: fontFamilyTenant,
          }}
        >
          Gestión de reserva
        </p>

        <h1 className="mt-2 text-2xl font-semibold text-white">Gestionar reserva</h1>

        <p className="mt-1 text-sm text-white/60">
          Desde aquí puedes cancelar o reprogramar tu reserva.
        </p>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          {err}
        </div>
      ) : null}

      {ok ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {ok}
        </div>
      ) : null}

      {!finalAction && (isExpired || isUsed) ? (
        <div
          className="rounded-2xl border bg-white/10 p-4 text-sm text-white/70"
          style={{ borderColor: `${secondaryColor}33` }}
        >
          {isExpired ? "Este enlace expiró." : null}
          {isExpired && isUsed ? " " : null}
          {isUsed ? "Este enlace ya fue utilizado." : null}
        </div>
      ) : null}

      <div
        className="rounded-[2rem] border bg-white/10 p-6 shadow-xl backdrop-blur-sm"
        style={{ borderColor: `${secondaryColor}33` }}
      >
        <h2 className="text-lg font-semibold text-white">Resumen</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-white/45">Cliente</p>
            <p className="mt-1 text-sm text-white">{data.reserva.clientName}</p>
            <p className="mt-1 text-xs text-white/45">{data.reserva.clientEmail}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/45">Estado</p>
            <p className="mt-1 text-sm text-white">
              {finalAction?.type === "CANCELADA" ? "CANCELADA" : data.reserva.status}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/45">Barbero</p>
            <p className="mt-1 text-sm text-white">{data.reserva.barber.name}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/45">Servicio</p>
            <p className="mt-1 text-sm text-white">{data.reserva.service.name}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/45">Inicio</p>
            <p className="mt-1 text-sm text-white">{formatDateTimeLocal(data.reserva.startAt)}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/45">Término</p>
            <p className="mt-1 text-sm text-white">{formatDateTimeLocal(data.reserva.endAt)}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/45">Duración</p>
            <p className="mt-1 text-sm text-white">{data.reserva.durationFinalMin} min</p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/45">Precio</p>
            <p
              className="mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold text-black"
              style={{ backgroundColor: secondaryColor }}
            >
              {formatCLP(data.reserva.priceFinal)}
            </p>
          </div>
        </div>
      </div>

      <div
        className="rounded-[2rem] border bg-white/10 p-6 shadow-xl backdrop-blur-sm"
        style={{ borderColor: `${secondaryColor}33` }}
      >
        <h2 className="text-lg font-semibold text-white">Acciones</h2>

        <p className="mt-1 text-sm text-white/60">
          Puedes cancelar o reprogramar si la reserva está confirmada.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={openConfirmCancelar}
            disabled={!canAct}
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar reserva
          </button>
        </div>

        <div
          className="mt-6 rounded-[1.5rem] border bg-black/30 p-4"
          style={{ borderColor: `${secondaryColor}33` }}
        >
          <p className="text-sm font-medium text-white">Reprogramar</p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/55">Fecha</label>

              <input
                type="date"
                value={date}
                min={todayISODate()}
                onChange={(e) => setDate(e.target.value)}
                disabled={!canAct || busy}
                className="w-full rounded-xl border border-white/10 bg-white px-3 py-2.5 text-sm text-black transition outline-none disabled:opacity-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/55">Hora</label>

              <div
                className="rounded-xl border bg-black/30 p-3"
                style={{ borderColor: `${secondaryColor}33` }}
              >
                {loadingSlots ? (
                  <p className="text-sm text-white/60">Cargando horas...</p>
                ) : disp?.closed ? (
                  <p className="text-sm text-white/60">El barbero no atiende este día.</p>
                ) : slotsDisponibles.length === 0 ? (
                  <p className="text-sm text-white/60">No hay horas disponibles.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slotsDisponibles.map((s) => {
                      const active = slot === s.time;
                      const disabled = !canAct || busy || s.disabled;

                      return (
                        <button
                          key={s.time}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSlot(s.time)}
                          className={[
                            "rounded-lg border px-3 py-2 text-xs font-medium transition",
                            disabled
                              ? "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
                              : active
                                ? "text-black"
                                : "border-white/15 bg-white/10 text-white hover:bg-white/20",
                          ].join(" ")}
                          style={
                            active
                              ? {
                                  backgroundColor: secondaryColor,
                                  borderColor: secondaryColor,
                                }
                              : undefined
                          }
                        >
                          {s.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <PoliticaCancelacion
                aceptado={politicaAceptada}
                setAceptado={setPoliticaAceptada}
                secondaryColor={secondaryColor}
                darkMode={true}
                cancellationHoursBefore={cancellationHoursBefore}
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={openConfirmReprogramar}
              disabled={!canAct || !slot || busy || !politicaAceptada}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: secondaryColor }}
            >
              Confirmar nueva hora
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
