"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { solicitarRecuperacion } from "@/services/auth.service";
import type { ApiError } from "@/lib/api";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";
import type { TenantPublico } from "@/services/tenant-publico.service";
import { obtenerVariableFuente } from "@/lib/fuentes-css";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

type Props = {
  initialTenant?: TenantPublico | null;
};

export default function ForgotPasswordClient({ initialTenant = null }: Props) {
  const router = useRouter();

  const [tenant, setTenant] = useState<TenantPublico | null>(initialTenant);
  const [cargandoTenant, setCargandoTenant] = useState(!initialTenant);

  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    title: "",
    message: "",
    variant: "success" as "success" | "error",
  });

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
    const value = email.trim();

    if (!touched) return "";
    if (!value) return "El correo es obligatorio.";
    if (!/\S+@\S+\.\S+/.test(value)) return "Formato de correo inválido.";

    return "";
  }, [email, touched]);

  const canSubmit = !loading && !emailError && email.trim();
  function mostrarFeedback(params: {
    title: string;
    message: string;
    variant: "success" | "error";
  }) {
    setFeedbackDialog({
      open: true,
      title: params.title,
      message: params.message,
      variant: params.variant,
    });
  }
  async function handleSubmit() {
    setTouched(true);

    const emailValue = email.trim();

    if (!emailValue) {
      mostrarFeedback({
        title: "Correo obligatorio",
        message: "Ingresa tu correo electrónico para recuperar el acceso.",
        variant: "error",
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(emailValue)) {
      mostrarFeedback({
        title: "Correo inválido",
        message: "Ingresa un correo con formato válido.",
        variant: "error",
      });
      return;
    }

    try {
      setLoading(true);

      const res = (await solicitarRecuperacion(emailValue)) as {
        mensaje?: string;
      };

      mostrarFeedback({
        title: "Solicitud enviada",
        message: res.mensaje || "Si el correo existe, recibirás instrucciones.",
        variant: "success",
      });

      setEmail("");
      setTouched(false);
    } catch (err) {
      const e = err as Partial<ApiError>;

      mostrarFeedback({
        title: "No se pudo enviar",
        message: e.message ?? "Ocurrió un error inesperado.",
        variant: "error",
      });
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

            <p className="mt-2 text-sm text-white/50">Preparando formulario de acceso.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
      style={{
        backgroundColor
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
            Recuperación de acceso
          </p>

          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Recuperar acceso</h1>

          <p className="mt-2 text-sm text-white/60">
            Ingresa tu correo para recibir un enlace de recuperación.
          </p>
        </div>

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
              <label className="text-sm font-medium text-white/80">Correo electrónico</label>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                type="email"
                placeholder="barbero@estudio.cl"
                className={`w-full rounded-xl border bg-black/40 px-3 py-2.5 text-sm text-white transition outline-none placeholder:text-white/30 ${
                  emailError ? "border-red-500" : "border-white/10"
                }`}
                autoComplete="email"
                inputMode="email"
                disabled={loading}
              />

              {emailError ? <p className="text-xs text-red-300">{emailError}</p> : null}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-black transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: secondaryColor,
              }}
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full text-sm text-white/45 transition hover:text-white"
            >
              Volver al login
            </button>
          </form>
        </div>
      </div>

      <FeedbackDialog
        open={feedbackDialog.open}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        variant={feedbackDialog.variant}
        onClose={() =>
          setFeedbackDialog((actual) => ({
            ...actual,
            open: false,
          }))
        }
      />
    </main>
  );
}
