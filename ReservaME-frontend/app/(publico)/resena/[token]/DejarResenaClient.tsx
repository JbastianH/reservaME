"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { crearResenaConToken, obtenerResenaPorToken } from "@/services/resenas-publicas.service";

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

function Star({
  filled,
  ...props
}: { filled: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={filled ? "Quitar estrella" : "Agregar estrella"}
      className="rounded-md p-1 hover:bg-neutral-100 focus:ring-2 focus:ring-black focus:outline-none"
      {...props}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        className={filled ? "fill-black" : "fill-none"}
      >
        <path
          d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          stroke="black"
          strokeWidth="1.4"
        />
      </svg>
    </button>
  );
}

type ResenaTokenInfo = {
  ok: true;
  token: { usedAt: string | null; expiresAt: string };
  reserva: {
    id: string;
    clientName: string;
    service: { name: string };
    barber: { name: string };
  };
};

export default function DejarResenaClient({ token }: { token: string }) {
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

    (async () => {
      setLoading(true);
      setErr("");
      setOk("");
      try {
        const r = await obtenerResenaPorToken(token);
        if (!alive) return;
        setData(r);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ? String(e.message) : "No se pudo cargar el enlace de reseña.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

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
    if (rating < 1 || rating > 5) return false;
    return true;
  }, [data, busy, expired, used, rating]);

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
      setOk(resp.mensaje ?? "¡Gracias! Tu reseña fue registrada ✔︎");
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "No se pudo enviar la reseña.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
        Cargando reseña...
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-black">Dejar reseña</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Tu opinión ayuda a mejorar la experiencia en Black & White Studio.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-neutral-500">Cliente</p>
            <p className="text-sm text-black">{data.reserva.clientName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">Servicio</p>
            <p className="text-sm text-black">{data.reserva.service.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">Barbero</p>
            <p className="text-sm text-black">{data.reserva.barber.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">Estado</p>
            <p className="text-sm text-black">{data.reserva.status}</p>
          </div>
        </div>
      </div>

      {ok ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          {ok}
        </div>
      ) : null}

      {err ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {expired || used ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          {expired ? "Este enlace expiró." : null}
          {expired && used ? " " : null}
          {used ? "Este enlace ya fue utilizado." : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-black">Tu calificación</h2>

        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} filled={i <= rating} disabled={!canSubmit} onClick={() => setRating(i)} />
          ))}
          <span className="ml-2 text-sm text-neutral-600">{rating}/5</span>
        </div>

        <div className="mt-5">
          <label className="text-xs font-medium text-neutral-600">Comentario (opcional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!canSubmit}
            rows={4}
            className="mt-1 w-full resize-none rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black disabled:opacity-50"
            placeholder="Cuéntanos cómo fue tu experiencia..."
          />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={() => void enviar()}
            disabled={!canSubmit}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy ? "Enviando..." : "Enviar reseña"}
          </button>
        </div>
      </div>
    </div>
  );
}
