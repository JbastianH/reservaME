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

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

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
    return d.toLocaleString("es-CL", { dateStyle: "full", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function formatCLP(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  try {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
  } catch {
    return `$${n}`;
  }
}

type SuccessAction = null | { type: "CANCELADA" } | { type: "REPROGRAMADA"; startAt: string };

type ConfirmState =
  | { open: false }
  | { open: true; kind: "cancelar" }
  | { open: true; kind: "reprogramar"; date: string; slot: string };

export default function GestionReservaClient({ token }: { token: string }) {
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
      } catch (e: any) {
        setErr(e?.message ? String(e.message) : "No se pudo cargar la gestión de la reserva.");
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
      } catch (e: any) {
        setErr(e?.message ? String(e.message) : "No se pudo cargar disponibilidad.");
      } finally {
        setLoadingSlots(false);
      }
    }

    void loadSlots();
  }, [data, date, finalAction]);

  const slotsDisponibles = useMemo(() => {
    if (!disp || disp.closed) return [];
    const taken = new Set(disp.taken ?? []);
    return (disp.slots ?? []).map((s) => ({ time: s, disabled: taken.has(s) }));
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
      setErr("Este enlace no permite cancelar (expiró, ya se usó o la reserva ya no está confirmada).");
      return;
    }

    try {
      setBusy(true);
      const r = await cancelarGestionReserva(token);
      setFinalAction({ type: "CANCELADA" });
      setOk(r.mensaje ?? "Reserva cancelada ✔︎");
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "No se pudo cancelar.");
    } finally {
      setBusy(false);
    }
  }

  async function doReprogramar(dateStr: string, slotStr: string) {
    setErr("");
    setOk("");

    if (!canAct) {
      setErr("Este enlace no permite reprogramar (expiró, ya se usó o la reserva ya no está confirmada).");
      return;
    }

    if (!slotStr) {
      setErr("Selecciona una hora.");
      return;
    }

    // Validación extra por seguridad
    if (!politicaAceptada) {
      setErr("Debes aceptar la política de cancelación.");
      return;
    }

    try {
      setBusy(true);
      const startAtISO = buildLocalDateTimeISO(dateStr, slotStr);

      const r = await reprogramarGestionReserva(token, startAtISO);

      setFinalAction({ type: "REPROGRAMADA", startAt: startAtISO });
      setOk(r.mensaje ?? "Reserva reprogramada ✔︎");

      setData((prev) => {
        if (!prev) return prev;
        const startAt = new Date(startAtISO);
        const endAt = new Date(startAt.getTime() + prev.reserva.durationFinalMin * 60 * 1000).toISOString();
        return {
          ...prev,
          reserva: {
            ...prev.reserva,
            startAt: startAt.toISOString(),
            endAt,
          },
        };
      });
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "No se pudo reprogramar.");
    } finally {
      setBusy(false);
    }
  }

  function openConfirmCancelar() {
    setConfirm({ open: true, kind: "cancelar" });
  }

  function openConfirmReprogramar() {
    if (!slot) {
      setErr("Selecciona una hora antes de reprogramar.");
      return;
    }
    // Validación UI antes de abrir modal
    if (!politicaAceptada) {
      setErr("Debes aceptar la política de cancelación para continuar.");
      return;
    }
    setConfirm({ open: true, kind: "reprogramar", date, slot });
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
      return;
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
        Cargando reserva...
      </div>
    );
  }

  if (err && !data) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-700">
        {err}
      </div>
    );
  }

  if (!data) return null;

  return (
    <section className="space-y-6">
      <AlertDialog open={confirm.open} onOpenChange={(open) => setConfirm(open ? confirm : { open: false })}>
        <AlertDialogContent className="rounded-2xl border border-neutral-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black">
              {confirm.open && confirm.kind === "cancelar" ? "Confirmar cancelación" : "Confirmar reprogramación"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-neutral-600">
              {confirm.open && confirm.kind === "cancelar" ? (
                <>
                  ¿Seguro que quieres <span className="font-medium text-black">cancelar</span> tu reserva?
                  <br />
                  Esta acción <span className="font-medium text-black">no se puede deshacer</span>.
                </>
              ) : confirm.open && confirm.kind === "reprogramar" ? (
                <>
                  Vas a reprogramar tu reserva para:
                  <br />
                  <span className="mt-2 inline-flex rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-black">
                    {confirm.date} • {confirm.slot}
                  </span>
                  <br />
                  ¿Confirmas el cambio?
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg border border-neutral-300 bg-white text-black hover:bg-neutral-50">
              Volver
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => void onConfirmAction()}
              className="rounded-lg bg-black text-white hover:bg-neutral-800"
            >
              {busy ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div>
        <h1 className="text-2xl font-semibold text-white">Gestionar reserva</h1>
        <p className="mt-1 text-sm text-white">Desde aquí puedes cancelar o reprogramar tu reserva.</p>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{err}</div>
      ) : null}

      {ok ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          {ok}
        </div>
      ) : null}

      {!finalAction && (isExpired || isUsed) ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          {isExpired ? "Este enlace expiró." : null}
          {isExpired && isUsed ? " " : null}
          {isUsed ? "Este enlace ya fue utilizado." : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-black">Resumen</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-neutral-500">Cliente</p>
            <p className="text-sm text-black">{data.reserva.clientName}</p>
            <p className="text-xs text-neutral-500">{data.reserva.clientEmail}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500">Estado</p>
            <p className="text-sm text-black">
              {finalAction?.type === "CANCELADA" ? "CANCELADA" : data.reserva.status}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500">Barbero</p>
            <p className="text-sm text-black">{data.reserva.barber.name}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500">Servicio</p>
            <p className="text-sm text-black">{data.reserva.service.name}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500">Inicio</p>
            <p className="text-sm text-black">{formatDateTimeLocal(data.reserva.startAt)}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500">Término</p>
            <p className="text-sm text-black">{formatDateTimeLocal(data.reserva.endAt)}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500">Duración</p>
            <p className="text-sm text-black">{data.reserva.durationFinalMin} min</p>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-500">Precio</p>
            <p className="text-sm text-black">{formatCLP(data.reserva.priceFinal)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-black">Acciones</h2>
        <p className="mt-1 text-sm text-neutral-600">Puedes cancelar o reprogramar si la reserva está confirmada.</p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={openConfirmCancelar}
            disabled={!canAct}
            className="rounded-lg border border-neutral-300 bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            Cancelar reserva
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-medium text-black">Reprogramar</p>

          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-600">Fecha</label>
              <input
                type="date"
                value={date}
                min={todayISODate()}
                onChange={(e) => setDate(e.target.value)}
                disabled={!canAct || busy}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black disabled:opacity-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-600">Hora</label>

              <div className="rounded-xl border border-neutral-200 bg-white p-3">
                {loadingSlots ? (
                  <p className="text-sm text-neutral-600">Cargando horas...</p>
                ) : disp?.closed ? (
                  <p className="text-sm text-neutral-600">El barbero no atiende este día.</p>
                ) : slotsDisponibles.length === 0 ? (
                  <p className="text-sm text-neutral-600">No hay horas disponibles.</p>
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
                            "rounded-lg px-3 py-2 text-xs font-medium transition",
                            disabled
                              ? "cursor-not-allowed border border-neutral-200 bg-neutral-50 text-neutral-400"
                              : active
                                ? "border border-black bg-black text-white"
                                : "border border-neutral-300 bg-white text-black hover:bg-neutral-50",
                          ].join(" ")}
                        >
                          {s.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="mt-2 text-xs text-neutral-500">
                Intervalos de 1 hora. La disponibilidad final la valida el servidor.
              </p>
            </div>

            <div className="md:col-span-2">
              <PoliticaCancelacion 
                aceptado={politicaAceptada} 
                setAceptado={setPoliticaAceptada} 
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={openConfirmReprogramar}
              // Se bloquea el boton si no se acepta la politica
              disabled={!canAct || !slot || busy || !politicaAceptada}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Confirmar nueva hora
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}