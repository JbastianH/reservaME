"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { crearResenaConToken, obtenerResenaPorToken } from "@/services/resenas-publicas.service";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

function obtenerMensajeError(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}

function Star({
  filled,
  secondaryColor,
  ...props
}: {
  filled: boolean;
  secondaryColor: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={filled ? "Quitar estrella" : "Agregar estrella"}
      className="rounded-md p-1 transition hover:bg-white/10 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        color: secondaryColor,
      }}
      {...props}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        className={filled ? "fill-current" : "fill-none"}
      >
        <path
          d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    </button>
  );
}

type Props = {
  token: string;
  secondaryColor?: string;
  fontFamilyTenant?: string;
};

export default function DejarResenaClient({
  token,
  secondaryColor = "#ffffff",
  fontFamilyTenant,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof obtenerResenaPorToken>> | null>(null);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (!token || token === "undefined") {
      setLoading(false);
      setErr("Enlace de reseña inválido.");
      return;
    }

    let alive = true;

    async function cargarResena() {
      setLoading(true);
      setErr("");
      setOk("");

      try {
        const r = await obtenerResenaPorToken(token);

        if (!alive) return;

        setData(r);
      } catch (e) {
        if (!alive) return;

        setErr(obtenerMensajeError(e, "No se pudo cargar el enlace de reseña."));
      } finally {
        if (!alive) return;

        setLoading(false);
      }
    }

    void cargarResena();

    return () => {
      alive = false;
    };
  }, [token]);

  const expired = useMemo(() => {
    if (!data) return false;

    return isExpired(data.token.expiresAt);
  }, [data]);

  const used = useMemo(() => {
    if (!data) return false;

    return Boolean(data.token.usedAt) || Boolean(data.yaTieneResena);
  }, [data]);

  const canSubmit = useMemo(() => {
    if (!data) return false;
    if (busy) return false;
    if (expired) return false;
    if (used) return false;
    if (ok) return false;
    if (rating < 1 || rating > 5) return false;

    return true;
  }, [data, busy, expired, used, rating, ok]);

  async function enviar() {
    setErr("");
    setOk("");

    if (!canSubmit) return;

    try {
      setBusy(true);

      const resp = await crearResenaConToken(token, {
        rating,
        comment: comment.trim() ? comment.trim() : undefined,
      });

      setOk(resp.mensaje ?? "¡Gracias! Tu reseña fue registrada correctamente.");
    } catch (e) {
      setErr(obtenerMensajeError(e, "No se pudo enviar la reseña."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div
        className="rounded-[2rem] border bg-white/10 p-6 text-sm text-white/60 shadow-2xl backdrop-blur-sm"
        style={{ borderColor: `${secondaryColor}55` }}
      >
        Cargando reseña...
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
      <FeedbackDialog
        open={Boolean(ok)}
        title="Reseña enviada"
        message={ok}
        variant="success"
        onClose={() => setOk("")}
      />

      <div>
        <p
          className="text-xs font-semibold tracking-[0.35em] uppercase"
          style={{
            color: secondaryColor,
            fontFamily: fontFamilyTenant,
          }}
        >
          Opinión del cliente
        </p>

        <h1 className="mt-2 text-2xl font-semibold text-white">Dejar reseña</h1>

        <p className="mt-1 text-sm text-white/60">
          Tu opinión ayuda a mejorar la experiencia en nuestro local.
        </p>
      </div>

      <div
        className="rounded-[2rem] border bg-white/10 p-6 shadow-xl backdrop-blur-sm"
        style={{ borderColor: `${secondaryColor}33` }}
      >
        <h2 className="text-lg font-semibold text-white">Datos de la reserva</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-white/45">Cliente</p>
            <p className="mt-1 text-sm text-white">{data.reserva.clientName}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/45">Servicio</p>
            <p className="mt-1 text-sm text-white">{data.reserva.service.name}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/45">Barbero</p>
            <p className="mt-1 text-sm text-white">{data.reserva.barber.name}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-white/45">Estado</p>
            <p className="mt-1 text-sm text-white">{data.reserva.status}</p>
          </div>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          {err}
        </div>
      ) : null}

      {expired || used ? (
        <div
          className="rounded-2xl border bg-white/10 p-4 text-sm text-white/70"
          style={{ borderColor: `${secondaryColor}33` }}
        >
          {expired ? "Este enlace expiró." : null}
          {expired && used ? " " : null}
          {used ? "Este enlace ya fue utilizado." : null}
        </div>
      ) : null}

      <div
        className="rounded-[2rem] border bg-white/10 p-6 shadow-xl backdrop-blur-sm"
        style={{ borderColor: `${secondaryColor}33` }}
      >
        <h2 className="text-lg font-semibold text-white">Tu calificación</h2>

        <p className="mt-1 text-sm text-white/60">
          Selecciona de 1 a 5 estrellas según tu experiencia.
        </p>

        <div className="mt-4 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              filled={i <= rating}
              secondaryColor={secondaryColor}
              disabled={!canSubmit}
              onClick={() => setRating(i)}
            />
          ))}

          <span className="ml-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
            {rating}/5
          </span>
        </div>

        <div className="mt-6">
          <label className="text-xs font-medium text-white/55">Comentario opcional</label>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!canSubmit}
            rows={4}
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white transition outline-none placeholder:text-white/30 focus:border-white/40 disabled:opacity-50"
            placeholder="Cuéntanos cómo fue tu experiencia..."
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => void enviar()}
            disabled={!canSubmit}
            className="rounded-xl px-5 py-3 text-sm font-semibold text-black transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: secondaryColor }}
          >
            {busy ? "Enviando..." : "Enviar reseña"}
          </button>
        </div>
      </div>
    </section>
  );
}
