"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/lib/useRouter";
import {
  obtenerDisponibilidadPublica,
  type DisponibilidadPublicaResponse,
} from "@/services/disponibilidad-publica.service";
import { crearReservaPublica } from "@/services/reservas-publicas.service";
import { reprogramarReservaAdmin, reprogramarReservaBarbero } from "@/services/reservas.service";
import PoliticaCancelacion from "./PoliticaCancelacion";

type Mode = "CREAR" | "REPROGRAMAR";
type ReprogramarActor = "BARBERO" | "ADMIN";

type Props = {
  open: boolean;
  onClose: () => void;
  barberId: string;
  barberSlug: string;
  barberName: string;
  barberServiceId: string;
  serviceName: string;
  durationMin: number;
  mode?: Mode;
  reservaId?: string;
  actor?: ReprogramarActor;
  initialDate?: string;
  onSuccess?: (info: { mensaje: string; startAtIso: string }) => void;
};

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

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhoneCL(v: string) {
  const s = v.trim().replace(/\s+/g, "");
  return /^(\+?56)?9\d{8}$/.test(s);
}

function normalizePhoneCL(v: string) {
  const s = v.trim().replace(/\s+/g, "");
  if (/^\+569\d{8}$/.test(s)) return s;
  if (/^569\d{8}$/.test(s)) return `+${s}`;
  if (/^9\d{8}$/.test(s)) return `+56${s}`;
  return v.trim();
}

export default function ReservaModal(props: Props) {
  const router = useRouter();

  const mode: Mode = props.mode ?? "CREAR";
  const actor: ReprogramarActor = props.actor ?? "BARBERO";

  const [date, setDate] = useState<string>(todayISODate());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [disp, setDisp] = useState<DisponibilidadPublicaResponse | null>(null);
  const [slot, setSlot] = useState<string>("");

  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    comment: "",
  });

  const [touched, setTouched] = useState({
    clientName: false,
    clientPhone: false,
    clientEmail: false,
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const slotsDisponibles = useMemo(() => {
    if (!disp || disp.closed) return [];
    const taken = new Set(disp.taken ?? []);
    return (disp.slots ?? []).map((s) => ({ time: s, disabled: taken.has(s) }));
  }, [disp]);

  const phoneError = useMemo(() => {
    if (!touched.clientPhone) return "";
    if (!form.clientPhone.trim()) return "Ingresa tu teléfono.";
    if (!isValidPhoneCL(form.clientPhone)) return "Teléfono inválido. Usa formato +569XXXXXXXX.";
    return "";
  }, [form.clientPhone, touched.clientPhone]);

  const emailError = useMemo(() => {
    if (!touched.clientEmail) return "";
    if (!form.clientEmail.trim()) return "Ingresa tu correo.";
    if (!isValidEmail(form.clientEmail)) return "Correo inválido. Ej: cliente@mail.com";
    return "";
  }, [form.clientEmail, touched.clientEmail]);

  const [politicaAceptada, setPoliticaAceptada] = useState(false);

  useEffect(() => {
    if (!props.open) return;
    setErr("");
    setOk("");
    setSlot("");
    setDisp(null);

    if (mode === "REPROGRAMAR") {
      if (props.initialDate) setDate(props.initialDate);
      else setDate(todayISODate());
    } else {
      setDate(todayISODate());
      setForm({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        comment: "",
      });
      setTouched({ clientName: false, clientPhone: false, clientEmail: false });
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") props.onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose, mode, props.initialDate]);

  useEffect(() => {
    if (!props.open) return;
    async function load() {
      setLoadingSlots(true);
      setErr("");
      setDisp(null);
      setSlot("");
      try {
        const r = await obtenerDisponibilidadPublica({ slug: props.barberSlug, date });
        setDisp(r);
      } catch (e: any) {
        setErr(e?.message ? String(e.message) : "No se pudo cargar disponibilidad.");
      } finally {
        setLoadingSlots(false);
      }
    }
    void load();
  }, [props.open, props.barberSlug, date]);

  const canSubmit = useMemo(() => {
    if (!props.open) return false;
    if (!slot) return false; // Debe haber hora seleccionada
    if (busy) return false; // No debe estar cargando

    if (mode === "CREAR") {
      if (!form.clientName.trim()) return false;
      if (phoneError) return false;
      if (emailError) return false;
      // Si no ha aceptado la política, el botón sigue deshabilitado
      if (!politicaAceptada) return false;
    }

    if (mode === "REPROGRAMAR") {
      if (!props.reservaId) return false;
    }
    return true;
  }, [
    props.open,
    slot,
    busy,
    mode,
    form.clientName,
    phoneError,
    emailError,
    props.reservaId,
    politicaAceptada,
  ]);

  async function confirmar() {
    setErr("");
    setOk("");

    if (!slot) {
      setErr("Selecciona una hora.");
      return;
    }

    try {
      setBusy(true);
      const startAtISO = buildLocalDateTimeISO(date, slot);

      if (mode === "CREAR") {
        const name = form.clientName.trim();
        const phone = form.clientPhone.trim();
        const email = form.clientEmail.trim();
        const comment = form.comment.trim();
        const commentFinal = comment ? comment.slice(0, 500) : null;

        setTouched({ clientName: true, clientPhone: true, clientEmail: true });

        if (!name) return setErr("Ingresa tu nombre.");
        if (!phone) return setErr("Ingresa tu teléfono.");
        if (!isValidPhoneCL(phone)) return setErr("Teléfono inválido. Usa formato +569XXXXXXXX.");
        if (!email) return setErr("Ingresa tu correo.");
        if (!isValidEmail(email)) return setErr("Correo inválido. Ej: cliente@mail.com");

        const resp = await crearReservaPublica({
          barberId: props.barberId,
          barberServiceId: props.barberServiceId,
          startAt: startAtISO,
          clientName: name,
          clientPhone: normalizePhoneCL(phone),
          clientEmail: email.toLowerCase(),
          comment: commentFinal,
        });

        setOk("Reserva creada ✔︎");
        props.onClose();
        router.push(`/reserva/resumen?id=${encodeURIComponent(resp.reserva.id)}`);
        router.refresh();
        return;
      }

      const reservaId = props.reservaId;
      if (!reservaId) {
        setErr("Falta reservaId para reprogramar.");
        return;
      }

      if (actor === "ADMIN") {
        await reprogramarReservaAdmin(reservaId, startAtISO);
      } else {
        await reprogramarReservaBarbero(reservaId, startAtISO);
      }

      props.onSuccess?.({
        mensaje: "Reserva reprogramada. Correo enviado ✔︎",
        startAtIso: startAtISO,
      });

      setOk("Reserva reprogramada ✔︎");
      props.onClose();
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "No se pudo confirmar la acción.");
    } finally {
      setBusy(false);
    }
  }

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <button
        aria-label="Cerrar"
        onClick={props.onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Dialog Wrapper */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl sm:max-h-[90vh]">
          {/* Header (Fijo) */}
          <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-neutral-200 bg-white p-5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-neutral-500">
                {mode === "CREAR" ? "Reserva" : "Reprogramar reserva"}
              </p>
              <h3 className="truncate text-lg font-semibold text-black">
                {props.serviceName} • {props.barberName}
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Duración aprox: {props.durationMin} min
              </p>
            </div>

            <button
              onClick={props.onClose}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50"
            >
              Cerrar
            </button>
          </div>

          {/* Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5">
            {err ? (
              <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                {err}
              </div>
            ) : null}

            {ok ? (
              <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
                {ok}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Fecha */}
              <div className="space-y-1 min-w-0">
                <label className="text-xs font-medium text-neutral-600">Fecha</label>
                <input
                  type="date"
                  value={date}
                  min={todayISODate()}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={busy}
                  className="w-full min-w-0 max-w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black disabled:opacity-50"
                />
              </div>

              {/* Hora */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Hora</label>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
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
                        return (
                          <button
                            key={s.time}
                            type="button"
                            disabled={busy || s.disabled}
                            onClick={() => setSlot(s.time)}
                            className={[
                              "rounded-lg px-3 py-2 text-xs font-medium transition",
                              s.disabled
                                ? "cursor-not-allowed border border-neutral-200 bg-white text-neutral-400"
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
              </div>

              {mode === "CREAR" ? (
                <>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-neutral-600">Nombre</label>
                    <input
                      value={form.clientName}
                      onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
                      onBlur={() => setTouched((p) => ({ ...p, clientName: true }))}
                      disabled={busy}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black disabled:opacity-50"
                      placeholder="Nombre y apellido"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-600">Teléfono</label>
                    <input
                      value={form.clientPhone}
                      onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))}
                      onBlur={() => setTouched((p) => ({ ...p, clientPhone: true }))}
                      disabled={busy}
                      className={[
                        "w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none disabled:opacity-50",
                        phoneError ? "border-red-400" : "border-neutral-300 focus:border-black",
                      ].join(" ")}
                      placeholder="+56 9 1234 5678"
                    />
                    {phoneError ? <p className="text-xs text-red-600">{phoneError}</p> : null}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-600">Email</label>
                    <input
                      type="email"
                      value={form.clientEmail}
                      onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))}
                      onBlur={() => setTouched((p) => ({ ...p, clientEmail: true }))}
                      disabled={busy}
                      className={[
                        "w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none disabled:opacity-50",
                        emailError ? "border-red-400" : "border-neutral-300 focus:border-black",
                      ].join(" ")}
                      placeholder="cliente@mail.com"
                    />
                    {emailError ? <p className="text-xs text-red-600">{emailError}</p> : null}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-neutral-600">
                      Comentario (opcional)
                    </label>
                    <textarea
                      value={form.comment}
                      onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                      disabled={busy}
                      maxLength={500}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black disabled:opacity-50"
                      placeholder="Ej: Quiero degradado bajo..."
                    />
                    <p className="text-xs text-neutral-500">{form.comment.length}/500</p>
                  </div>
                  <div className="md:col-span-2">
                    <PoliticaCancelacion
                      aceptado={politicaAceptada}
                      setAceptado={setPoliticaAceptada}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700 md:col-span-2">
                  Estás reprogramando esta reserva. El cliente recibirá un correo.
                </div>
              )}
            </div>
          </div>

          {/* Footer (Fijo) */}
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-neutral-200 bg-white p-5">
            <p className="text-xs text-neutral-500">
              {mode === "CREAR"
                ? "Al confirmar, se creará la reserva."
                : "Al confirmar, se reprogramará la reserva."}
            </p>

            <button
              onClick={() => void confirmar()}
              // Bloquea si NO se puede enviar (checkbox off) O si está ocupado (cargando)
              disabled={!canSubmit || busy}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Procesando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
