"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { resetPassword } from "@/services/auth.service";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";
import type { TenantPublico } from "@/services/tenant-publico.service";
import { obtenerVariableFuente } from "@/lib/fuentes-css";

type Props = {
  initialTenant?: TenantPublico | null;
};

type FormState = {
  password: string;
  confirmPassword: string;
};

function obtenerMensajeError(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }

  return "No se pudo actualizar la contraseña.";
}

export default function ResetPasswordClient({ initialTenant = null }: Props) {
  const router = useRouter();
  const params = useParams<{ token: string }>();

  const token = typeof params?.token === "string" ? params.token : "";

  const [tenant, setTenant] = useState<TenantPublico | null>(initialTenant);
  const [cargandoTenant, setCargandoTenant] = useState(!initialTenant);

  const [form, setForm] = useState<FormState>({
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    if (!form.password) return "La contraseña es obligatoria.";
    if (form.password.length < 8) return "Mínimo 8 caracteres.";

    return "";
  }, [form.password, touched.password]);

  const confirmError = useMemo(() => {
    if (!touched.confirmPassword) return "";
    if (!form.confirmPassword) return "Debes confirmar la contraseña.";
    if (form.confirmPassword !== form.password) {
      return "Las contraseñas no coinciden.";
    }

    return "";
  }, [form.confirmPassword, form.password, touched.confirmPassword]);

  const canSubmit =
    !loading &&
    Boolean(token) &&
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

    if (!token) {
      setErrorGlobal("El enlace de recuperación no es válido.");
      return;
    }

    if (!form.password || !form.confirmPassword) return;
    if (passwordError || confirmError) return;

    try {
      setLoading(true);

      await resetPassword({
        token,
        password: form.password,
      });

      setSuccessMsg("Contraseña actualizada con éxito.");

      setForm({
        password: "",
        confirmPassword: "",
      });

      setTouched({
        password: false,
        confirmPassword: false,
      });
    } catch (err) {
      setErrorGlobal(obtenerMensajeError(err));
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

            <h1 className="mt-2 text-2xl font-semibold text-white">Cargando recuperación...</h1>

            <p className="mt-2 text-sm text-white/50">Preparando cambio de contraseña.</p>
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
        fontFamily,
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
            Recuperación de acceso
          </p>

          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Nueva contraseña</h1>

          <p className="mt-2 text-sm text-white/60">Elige tu nueva clave de acceso.</p>
        </div>

        {errorGlobal ? (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorGlobal}
          </div>
        ) : null}

        {successMsg ? (
          <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {successMsg}
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
                disabled={loading || Boolean(successMsg)}
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
                placeholder="Repite tu nueva contraseña"
                className={`w-full rounded-xl border bg-black/40 px-3 py-2.5 text-sm text-white transition outline-none placeholder:text-white/30 ${
                  confirmError ? "border-red-500" : "border-white/10"
                }`}
                autoComplete="new-password"
                disabled={loading || Boolean(successMsg)}
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
              {loading ? "Actualizando..." : "Cambiar contraseña"}
            </button>

            {successMsg ? (
              <button
                type="button"
                onClick={() => router.replace("/login")}
                className="w-full rounded-xl border bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20"
                style={{
                  borderColor: `${secondaryColor}55`,
                }}
              >
                Ir al login
              </button>
            ) : null}

            {!successMsg ? (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full text-sm text-white/45 transition hover:text-white"
              >
                Volver al login
              </button>
            ) : null}
          </form>
        </div>
      </div>
    </main>
  );
}
