"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { activarCuenta } from "@/services/auth.service";
import type { ApiError } from "@/lib/api";

type FormState = {
  password: string;
  confirmPassword: string;
};

function mapearErrorActivacion(err: unknown): string {
  const e = err as Partial<ApiError> | undefined;


  if (e?.status === 400) return e.message ?? "Token inválido o expirado.";
  if (e?.status === 404) return "Token inválido.";
  if (e?.status) return e.message ?? "No se pudo activar la cuenta.";

  return "No se pudo activar la cuenta. Intenta nuevamente.";
}

export default function ActivarCuentaPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();

  const token = typeof params?.token === "string" ? params.token : "";

  const [form, setForm] = useState<FormState>({ password: "", confirmPassword: "" });
  const [touched, setTouched] = useState<{ password: boolean; confirmPassword: boolean }>({
    password: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    const v = form.password;
    if (!v) return "La contraseña es obligatoria.";
    if (v.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    return "";
  }, [form.password, touched.password]);

  const confirmError = useMemo(() => {
    if (!touched.confirmPassword) return "";
    const v = form.confirmPassword;
    if (!v) return "Confirma tu contraseña.";
    if (v !== form.password) return "Las contraseñas no coinciden.";
    return "";
  }, [form.confirmPassword, form.password, touched.confirmPassword]);

  const tokenError = useMemo(() => {
    if (!token) return "Token inválido o faltante.";
    return "";
  }, [token]);

  const canSubmit =
    !loading &&
    !tokenError &&
    !passwordError &&
    !confirmError &&
    form.password &&
    form.confirmPassword;

  async function handleSubmit() {
    setTouched({ password: true, confirmPassword: true });
    setErrorGlobal("");
    setSuccessMsg("");

    if (!canSubmit) return;

    try {
      setLoading(true);

      const res = await activarCuenta({
        token,
        password: form.password,
      });

      setSuccessMsg(res.mensaje || "Cuenta activada correctamente.");
      // limpiar formulario
      setForm({ password: "", confirmPassword: "" });
    } catch (err) {
      setErrorGlobal(mapearErrorActivacion(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-2xl bg-black p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Activar cuenta</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Crea tu contraseña para activar tu acceso.
        </p>

        {tokenError ? (
          <div className="mt-6 rounded-lg border border-red-600/40 bg-red-600/10 px-3 py-2 text-sm text-red-200">
            {tokenError}
          </div>
        ) : null}

        {errorGlobal ? (
          <div className="mt-6 rounded-lg border border-red-600/40 bg-red-600/10 px-3 py-2 text-sm text-red-200">
            {errorGlobal}
          </div>
        ) : null}

        {successMsg ? (
          <div className="mt-6 rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-200">
            {successMsg}
          </div>
        ) : null}

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-200">Nueva contraseña</label>
            <input
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              onBlur={() => setTouched((p) => ({ ...p, password: true }))}
              type="password"
              placeholder="••••••••"
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-white outline-none ${
                passwordError ? "border-red-500" : "border-neutral-700 focus:border-white"
              }`}
              autoComplete="new-password"
              disabled={loading || !!tokenError}
            />
            {passwordError ? <p className="text-xs text-red-400">{passwordError}</p> : null}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-200">Confirmar contraseña</label>
            <input
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
              type="password"
              placeholder="••••••••"
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-white outline-none ${
                confirmError ? "border-red-500" : "border-neutral-700 focus:border-white"
              }`}
              autoComplete="new-password"
              disabled={loading || !!tokenError}
            />
            {confirmError ? <p className="text-xs text-red-400">{confirmError}</p> : null}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {loading ? "Activando..." : "Activar cuenta"}
          </button>

          {successMsg ? (
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="w-full rounded-lg border border-white/30 bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Ir a iniciar sesión
            </button>
          ) : null}
        </form>
      </div>
    </main>
  );
}