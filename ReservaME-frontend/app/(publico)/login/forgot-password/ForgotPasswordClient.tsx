"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { solicitarRecuperacion } from "@/services/auth.service"; // Debes crear esta función en tu service
import type { ApiError } from "@/lib/api";

export default function ForgotPasswordClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const emailError = useMemo(() => {
    if (!touched) return "";
    if (!email) return "El correo es obligatorio.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Formato de correo inválido.";
    return "";
  }, [email, touched]);

  const canSubmit = !loading && !emailError && email;

  async function handleSubmit() {
    setTouched(true);
    setErrorGlobal("");
    setSuccessMsg("");

    if (!canSubmit) return;

    try {
      setLoading(true);
      const res = await solicitarRecuperacion(email) as { mensaje?: string };
      setSuccessMsg(res.mensaje || "Si el correo existe, recibirás instrucciones.");
      setEmail("");
      setTouched(false);
    } catch (err) {
      const e = err as Partial<ApiError>;
      setErrorGlobal(e.message ?? "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-black p-6 shadow-xl border border-neutral-800">
        <h1 className="text-2xl font-semibold text-white">Recuperar acceso</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Ingresa tu correo para recibir un enlace de recuperación.
        </p>

        {errorGlobal && (
          <div className="mt-6 rounded-lg border border-red-600/40 bg-red-600/10 px-3 py-2 text-sm text-red-200">
            {errorGlobal}
          </div>
        )}

        {successMsg && (
          <div className="mt-6 rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-200">
            {successMsg}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-200">Correo electrónico</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              type="email"
              placeholder="barbero@estudio.cl"
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-white outline-none ${
                emailError ? "border-red-500" : "border-neutral-700 focus:border-white"
              }`}
              disabled={loading}
            />
            {emailError && <p className="text-xs text-red-400">{emailError}</p>}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full text-sm text-neutral-400 hover:text-white transition"
          >
            Volver al login
          </button>
        </form>
      </div>
    </main>
  );
}