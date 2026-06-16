"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { useSession } from "@/context/SesionProvider";
import { apiPost } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth-storage";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";
import type { TenantPublico } from "@/services/tenant-publico.service";
import { obtenerVariableFuente } from "@/lib/fuentes-css";

type FormState = {
  email: string;
  password: string;
};

type Props = {
  initialTenant?: TenantPublico | null;
};

function mapearErrorLogin(err: unknown): string {
  const e = err as Partial<ApiError> | undefined;

  if (e?.status === 401) {
    return "Credenciales inválidas. Revisa tu correo y contraseña.";
  }

  if (e?.status === 403) {
    return "Tu cuenta aún no está activada. Revisa tu correo de activación.";
  }

  if (e?.status) return e.message ?? "No se pudo iniciar sesión.";

  return "No se pudo iniciar sesión. Intenta nuevamente.";
}

export default function LoginClient({ initialTenant = null }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetchSession } = useSession();

  const redirect = searchParams.get("redirect");

  const [tenant, setTenant] = useState<TenantPublico | null>(initialTenant);
  const [cargandoTenant, setCargandoTenant] = useState(!initialTenant);

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState<{
    email: boolean;
    password: boolean;
  }>({
    email: false,
    password: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string>("");

  useEffect(() => {
    if (initialTenant) return;

    async function cargarTenant() {
      try {
        const data = await obtenerTenantPublico();
        setTenant(data);
      } catch {
        setTenant(null);
      } finally {
        setCargandoTenant(false);
      }
    }

    void cargarTenant();
  }, [initialTenant]);

  const settings = tenant?.settings;

  const backgroundColor = settings?.primaryColor || "#000000";
  const secondaryColor = settings?.secondaryColor || "#ffffff";
  const fontFamily = obtenerVariableFuente(settings?.fontFamily);
  const tenantName = tenant?.name || "ReservaME";

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
      }>(
        "/auth/login",
        {
          email: form.email.trim(),
          password: form.password,
        },
        { auth: false },
      );

      setToken(data.accessToken);

      document.cookie = "auth_flag=true; path=/; max-age=86400; SameSite=Lax";

      await refetchSession();

      if (redirect) {
        router.replace(redirect);
        return;
      }

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

  if (cargandoTenant) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-black px-4 py-10">
        <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-8 py-10 text-center shadow-2xl backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />

          <div>
            <p className="text-sm font-semibold tracking-[0.3em] text-white/50 uppercase">
              {tenantName}
            </p>

            <h1 className="mt-2 text-2xl font-semibold text-white">Cargando login...</h1>

            <p className="mt-2 text-sm text-white/50">Preparando acceso privado.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
      style={{
        backgroundColor,
      }}
    >
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: `${secondaryColor}25` }}
      />

      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: `${secondaryColor}18` }}
      />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm sm:p-8"
        style={{
          background: "linear-gradient(135deg, rgba(10,10,10,0.92), rgba(38,38,38,0.86))",
          borderColor: `${secondaryColor}55`,
        }}
      >
        <div className="mb-6 h-1 w-24 rounded-full" style={{ backgroundColor: secondaryColor }} />

        <div className="mb-8">
          <p
            className="mb-2 text-xs font-semibold tracking-[0.35em] uppercase"
            style={{ color: secondaryColor, fontFamily }}
          >
            Acceso privado
          </p>

          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Iniciar sesión</h1>

          <p className="mt-2 text-sm text-white/60">
            Ingresa tus credenciales para acceder a tu cuenta.
          </p>
        </div>

        {errorGlobal ? (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorGlobal}
          </div>
        ) : null}

        <div
          className="rounded-[1.5rem] border bg-white/10 p-5 shadow-xl backdrop-blur-sm"
          style={{ borderColor: `${secondaryColor}33` }}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">Correo</label>

              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                type="email"
                placeholder="correo@ejemplo.com"
                className={`w-full rounded-xl border bg-black/40 px-3 py-2.5 text-sm text-white transition outline-none placeholder:text-white/30 ${
                  emailError ? "border-red-500" : "border-white/10"
                }`}
                autoComplete="email"
                inputMode="email"
                disabled={loading}
              />

              {emailError ? <p className="text-xs text-red-300">{emailError}</p> : null}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-white/80">Contraseña</label>

                <Link
                  href="/login/forgot-password"
                  className="text-xs text-white/45 transition hover:text-white"
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
                className={`w-full rounded-xl border bg-black/40 px-3 py-2.5 text-sm text-white transition outline-none placeholder:text-white/30 ${
                  passwordError ? "border-red-500" : "border-white/10"
                }`}
                autoComplete="current-password"
                disabled={loading}
              />

              {passwordError ? <p className="text-xs text-red-300">{passwordError}</p> : null}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-black transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: secondaryColor,
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-xs text-white/45">
              ¿Problemas para entrar? Pídele al administrador que reenvíe tu activación.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
