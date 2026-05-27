"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { resetPassword } from "@/services/auth.service"; // Debes crear esta función

export default function ResetPasswordClient() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === "string" ? params.token : "";

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    if (!form.password) return "La contraseña es obligatoria.";
    if (form.password.length < 8) return "Mínimo 8 caracteres.";
    return "";
  }, [form.password, touched.password]);

  const confirmError = useMemo(() => {
    if (!touched.confirmPassword) return "";
    if (form.confirmPassword !== form.password) return "Las contraseñas no coinciden.";
    return "";
  }, [form.confirmPassword, form.password, touched.confirmPassword]);

  const canSubmit = !loading && token && !passwordError && !confirmError && form.password;

  async function handleSubmit() {
    setTouched({ password: true, confirmPassword: true });
    if (!canSubmit) return;

    try {
      setLoading(true);
      await resetPassword({ token, password: form.password });
      setSuccessMsg("Contraseña actualizada con éxito.");
    } catch (err: any) {
      setErrorGlobal(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-black p-6 shadow-xl border border-neutral-800">
        <h1 className="text-2xl font-semibold text-white">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-neutral-300">Elige tu nueva clave de acceso.</p>

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
            <label className="text-sm font-medium text-neutral-200">Nueva contraseña</label>
            <input
              value={form.password}
              onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
              type="password"
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-white outline-none ${
                passwordError ? "border-red-500" : "border-neutral-700 focus:border-white"
              }`}
            />
            {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-200">Confirmar contraseña</label>
            <input
              value={form.confirmPassword}
              onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
              type="password"
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-white outline-none ${
                confirmError ? "border-red-500" : "border-neutral-700 focus:border-white"
              }`}
            />
            {confirmError && <p className="text-xs text-red-400">{confirmError}</p>}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Cambiar contraseña"}
          </button>

          {successMsg && (
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="w-full rounded-lg border border-white/30 bg-black px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Ir al Login
            </button>
          )}
        </form>
      </div>
    </main>
  );
}