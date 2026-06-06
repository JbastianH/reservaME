"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link"; // Importante para la navegación

import { useSession } from "@/context/SesionProvider";
import { apiPost } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth-storage";

type FormState = {
  email: string;
  password: string;
};

function mapearErrorLogin(err: unknown): string {
  const e = err as Partial<ApiError> | undefined;

  if (e?.status === 401) return "Credenciales inválidas. Revisa tu correo y contraseña.";
  if (e?.status === 403) return "Tu cuenta aún no está activada. Revisa tu correo de activación.";
  if (e?.status) return e.message ?? "No se pudo iniciar sesión.";

  return "No se pudo iniciar sesión. Intenta nuevamente.";
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetchSession } = useSession();

  const redirect = searchParams.get("redirect");

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string>("");

  const emailError = useMemo(() => {
    const v = form.email.trim();
    if (!touched.email) return "";
    if (!v) return "El correo es obligatorio.";
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!ok) return "Ingresa un correo válido.";
    return "";
  }, [form.email, touched.email]);

  const passwordError = useMemo(() => {
    const v = form.password;
    if (!touched.password) return "";
    if (!v) return "La contraseña es obligatoria.";
    return "";
  }, [form.password, touched.password]);

  const canSubmit = !emailError && !passwordError && form.email.trim() && form.password && !loading;

  async function handleSubmit() {
    setTouched({ email: true, password: true });
    setErrorGlobal("");

    if (!form.email.trim() || !form.password) return;
    if (emailError || passwordError) return;

    try {
      setLoading(true);

      const data = await apiPost<{
        ok: true;
        accessToken: string;
        role: "SUPER_ADMIN" | "ADMIN" | "BARBERO";
        tenantId: string | null;
      }>("/auth/login", { email: form.email.trim(), password: form.password }, { auth: false });

      setToken(data.accessToken);

      document.cookie = "auth_flag=true; path=/; max-age=86400; SameSite=Lax";

      await refetchSession();

      if (data.role === "SUPER_ADMIN") router.replace("/super-admin");
      else if (data.role === "ADMIN") router.replace("/admin");
      else if (data.role === "BARBERO") router.replace("/barbero");
      else router.replace("/");
    } catch (err) {
      setErrorGlobal(mapearErrorLogin(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-2xl bg-black p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Ingresa tus credenciales para acceder a tu cuenta.
        </p>

        {errorGlobal ? (
          <div className="mt-6 rounded-lg border border-red-600/40 bg-red-600/10 px-3 py-2 text-sm text-red-200">
            {errorGlobal}
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
            <label className="text-sm font-medium text-neutral-200">Correo</label>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              onBlur={() => setTouched((p) => ({ ...p, email: true }))}
              type="email"
              placeholder="correo@ejemplo.com"
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-white outline-none ${
                emailError ? "border-red-500" : "border-neutral-700 focus:border-white"
              }`}
              autoComplete="email"
              inputMode="email"
              disabled={loading}
            />
            {emailError ? <p className="text-xs text-red-400">{emailError}</p> : null}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-200">Contraseña</label>
              {/* ENLACE A RECUPERACIÓN */}
              <Link
                href="/login/forgot-password"
                className="text-xs text-neutral-400 transition-colors hover:text-white"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              onBlur={() => setTouched((p) => ({ ...p, password: true }))}
              type="password"
              placeholder="••••••••"
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-white outline-none ${
                passwordError ? "border-red-500" : "border-neutral-700 focus:border-white"
              }`}
              autoComplete="current-password"
              disabled={loading}
            />
            {passwordError ? <p className="text-xs text-red-400">{passwordError}</p> : null}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-xs text-neutral-400">
            ¿Problemas para entrar? Pídele al administrador que reenvíe tu activación.
          </p>
        </form>
      </div>
    </main>
  );
}