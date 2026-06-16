"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { activarCuenta } from "@/services/auth.service";
import type { ApiError } from "@/lib/api";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";
import type { TenantPublico } from "@/services/tenant-publico.service";
import { obtenerVariableFuente } from "@/lib/fuentes-css";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

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

  const [tenant, setTenant] = useState<TenantPublico | null>(null);
  const [cargandoTenant, setCargandoTenant] = useState(true);

  const [form, setForm] = useState<FormState>({
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState<{
    password: boolean;
    confirmPassword: boolean;
  }>({
    password: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
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
  }, []);

  const settings = tenant?.settings;

  const backgroundColor = settings?.primaryColor || "#000000";
  const secondaryColor = settings?.secondaryColor || "#ffffff";
  const fontFamilyTenant = obtenerVariableFuente(settings?.fontFamily);
  const tenantName = tenant?.name || "ReservaME";

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
    setTouched({
      password: true,
      confirmPassword: true,
    });

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

      setForm({
        password: "",
        confirmPassword: "",
      });

      setTouched({
        password: false,
        confirmPassword: false,
      });
    } catch (err) {
      setErrorGlobal(mapearErrorActivacion(err));
    } finally {
      setLoading(false);
    }
  }

  if (cargandoTenant) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-black px-4 py-10 font-sans">
        <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-8 py-10 text-center shadow-2xl backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />

          <div>
            <p
              className="text-sm font-semibold tracking-[0.3em] text-white/50 uppercase"
              style={{ fontFamily: fontFamilyTenant }}
            >
              {tenantName}
            </p>

            <h1 className="mt-2 text-2xl font-semibold text-white">Cargando activación...</h1>

            <p className="mt-2 text-sm text-white/50">Preparando creación de contraseña.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-10 font-sans sm:px-6"
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
            style={{ color: secondaryColor }}
          >
            Activación de cuenta
          </p>

          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Activar cuenta</h1>

          <p className="mt-2 text-sm text-white/60">Crea tu contraseña para activar tu acceso.</p>
        </div>

        {tokenError ? (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {tokenError}
          </div>
        ) : null}

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
              <label className="text-sm font-medium text-white/80">Nueva contraseña</label>

              <input
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    password: e.target.value,
                  }))
                }
                onBlur={() =>
                  setTouched((p) => ({
                    ...p,
                    password: true,
                  }))
                }
                type="password"
                placeholder="Mínimo 8 caracteres"
                className={`w-full rounded-xl border bg-black/40 px-3 py-2.5 text-sm text-white transition outline-none placeholder:text-white/30 ${
                  passwordError ? "border-red-500" : "border-white/10"
                }`}
                autoComplete="new-password"
                disabled={loading || Boolean(tokenError) || Boolean(successMsg)}
              />

              {passwordError ? <p className="text-xs text-red-300">{passwordError}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">Confirmar contraseña</label>

              <input
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    confirmPassword: e.target.value,
                  }))
                }
                onBlur={() =>
                  setTouched((p) => ({
                    ...p,
                    confirmPassword: true,
                  }))
                }
                type="password"
                placeholder="Repite tu contraseña"
                className={`w-full rounded-xl border bg-black/40 px-3 py-2.5 text-sm text-white transition outline-none placeholder:text-white/30 ${
                  confirmError ? "border-red-500" : "border-white/10"
                }`}
                autoComplete="new-password"
                disabled={loading || Boolean(tokenError) || Boolean(successMsg)}
              />

              {confirmError ? <p className="text-xs text-red-300">{confirmError}</p> : null}
            </div>

            <button
              type="submit"
              disabled={!canSubmit || Boolean(successMsg)}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-black transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: secondaryColor,
              }}
            >
              {loading ? "Activando..." : "Activar cuenta"}
            </button>
          </form>
        </div>
      </div>

      <FeedbackDialog
        open={Boolean(successMsg)}
        title="Cuenta activada"
        message={successMsg}
        variant="success"
        onClose={() => router.replace("/login")}
      />
    </main>
  );
}
