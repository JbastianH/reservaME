"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminSettings } from "@/lib/useAdminSettings";
import {
  actualizarConfiguracionTenantAdmin,
  obtenerConfiguracionTenantAdmin,
  type AdminTenantConfiguracion,
} from "@/services/admin-tenant.service";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";
import { FUENTES_TENANT, FUENTE_TENANT_DEFAULT } from "@/lib/fuentes-tenant";
import { subirArchivoCloudinary } from "@/services/media.service";
import { obtenerVariableFuente } from "@/lib/fuentes-css";

type TenantForm = {
  name: string;
  address: string;
  instagramUrl: string;
  logoUrl: string;
  heroImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  headerColor: string;
  footerColor: string;
  fontFamily: string;
};

const initialTenantForm: TenantForm = {
  name: "",
  address: "",
  instagramUrl: "",
  logoUrl: "",
  heroImageUrl: "",
  primaryColor: "#000000",
  secondaryColor: "#FFFFFF",
  headerColor: "#000000",
  footerColor: "#000000",
  fontFamily: FUENTE_TENANT_DEFAULT,
};

export default function AdminSettingsPage() {
  const { data, loading, saving, error, refetch, saveSettings } = useAdminSettings();

  const [hours, setHours] = useState<number>(24);
  const [cancellationHours, setCancellationHours] = useState<number>(3);

  const [tenant, setTenant] = useState<AdminTenantConfiguracion | null>(null);
  const [tenantForm, setTenantForm] = useState<TenantForm>(initialTenantForm);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [savingTenant, setSavingTenant] = useState(false);
  const [tenantError, setTenantError] = useState("");

  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [subiendoHero, setSubiendoHero] = useState(false);

  const [feedback, setFeedback] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "success" | "error" | "info";
  }>({
    open: false,
    title: "",
    message: "",
    variant: "info",
  });

  const fuentePreview = obtenerVariableFuente(tenantForm.fontFamily || FUENTE_TENANT_DEFAULT);

  useEffect(() => {
    if (data?.reminderHoursBefore != null) {
      setHours(Number(data.reminderHoursBefore));
    }

    if (data?.cancellationHoursBefore != null) {
      setCancellationHours(Number(data.cancellationHoursBefore));
    }
  }, [data]);

  useEffect(() => {
    void cargarConfiguracionTenant();
  }, []);

  async function cargarConfiguracionTenant() {
    setLoadingTenant(true);
    setTenantError("");

    try {
      const res = await obtenerConfiguracionTenantAdmin();
      const t = res.tenant;

      setTenant(t);
      setTenantForm({
        name: t.name ?? "",
        address: t.address ?? "",
        instagramUrl: t.instagramUrl ?? "",
        logoUrl: t.settings?.logoUrl ?? "",
        heroImageUrl: t.settings?.heroImageUrl ?? "",
        primaryColor: t.settings?.primaryColor ?? "#000000",
        secondaryColor: t.settings?.secondaryColor ?? "#FFFFFF",
        headerColor: t.settings?.headerColor ?? "#000000",
        footerColor: t.settings?.footerColor ?? "#000000",
        fontFamily: t.settings?.fontFamily ?? FUENTE_TENANT_DEFAULT,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo cargar la configuración de la barbería.";

      setTenantError(message);
    } finally {
      setLoadingTenant(false);
    }
  }

  const invalidReminder = hours < 1 || hours > 168;
  const invalidCancellation = cancellationHours < 1 || cancellationHours > 168;

  const invalid = invalidReminder || invalidCancellation;

  const tenantInvalid = useMemo(() => {
    if (!tenantForm.name.trim()) return true;
    return false;
  }, [tenantForm.name]);

  function updateTenantForm<K extends keyof TenantForm>(key: K, value: TenantForm[K]) {
    setTenantForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function onSaveReminder() {
    const res = await saveSettings({
      reminderHoursBefore: hours,
      cancellationHoursBefore: cancellationHours,
    });

    if (res.ok) {
      setFeedback({
        open: true,
        title: "Configuración guardada",
        message: "La configuración fue actualizada correctamente.",
        variant: "success",
      });
    }
  }

  async function onSaveTenant() {
    if (tenantInvalid) {
      setFeedback({
        open: true,
        title: "Faltan datos",
        message: "El nombre de la barbería es obligatorio.",
        variant: "error",
      });
      return;
    }

    setSavingTenant(true);
    setTenantError("");

    try {
      const res = await actualizarConfiguracionTenantAdmin({
        name: tenantForm.name.trim(),
        address: tenantForm.address.trim(),
        instagramUrl: tenantForm.instagramUrl.trim(),
        logoUrl: tenantForm.logoUrl.trim(),
        heroImageUrl: tenantForm.heroImageUrl.trim(),
        primaryColor: tenantForm.primaryColor,
        secondaryColor: tenantForm.secondaryColor,
        headerColor: tenantForm.headerColor,
        footerColor: tenantForm.footerColor,
        fontFamily: tenantForm.fontFamily.trim() || FUENTE_TENANT_DEFAULT,
      });

      setTenant(res.tenant);

      setFeedback({
        open: true,
        title: "Barbería actualizada",
        message: res.mensaje ?? "La configuración fue guardada correctamente.",
        variant: "success",
      });

      await cargarConfiguracionTenant();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo guardar la configuración de la barbería.";

      setTenantError(message);

      setFeedback({
        open: true,
        title: "Error al guardar",
        message,
        variant: "error",
      });
    } finally {
      setSavingTenant(false);
    }
  }

  async function onRefreshAll() {
    await Promise.all([refetch(), cargarConfiguracionTenant()]);
  }

  async function subirLogo(file: File) {
    setSubiendoLogo(true);

    try {
      const res = await subirArchivoCloudinary({
        file,
        variant: "tenant-logo",
      });

      updateTenantForm("logoUrl", res.url);
    } finally {
      setSubiendoLogo(false);
    }
  }

  async function subirHero(file: File) {
    setSubiendoHero(true);

    try {
      const res = await subirArchivoCloudinary({
        file,
        variant: "tenant-hero",
      });

      updateTenantForm("heroImageUrl", res.url);
    } finally {
      setSubiendoHero(false);
    }
  }

  return (
    <section className="space-y-6">
      <FeedbackDialog
        open={feedback.open}
        title={feedback.title}
        message={feedback.message}
        variant={feedback.variant}
        onClose={() =>
          setFeedback((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Configuración</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Ajustes del sistema y personalización de la barbería.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onRefreshAll()}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50"
        >
          Actualizar
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {tenantError ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {tenantError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-black">Recordatorio de reservas</h2>

        <p className="mt-1 text-sm text-neutral-600">
          Configura las horas del recordatorio y el texto informativo de la política de cancelación.
        </p>

        <div className="mt-4">
          {loading ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
              Cargando...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">
                  Horas antes del recordatorio
                </label>

                <input
                  type="number"
                  min={1}
                  max={168}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className={[
                    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none",
                    invalidReminder
                      ? "border-red-400 focus:border-red-500"
                      : "border-neutral-300 focus:border-black",
                  ].join(" ")}
                />

                {invalidReminder ? (
                  <p className="text-xs text-red-600">Debe estar entre 1 y 168 horas.</p>
                ) : (
                  <p className="text-xs text-neutral-500">
                    Ej: 24 = se enviará el recordatorio 1 día antes.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">
                  Horas para política de cancelación
                </label>

                <input
                  type="number"
                  min={1}
                  max={168}
                  value={cancellationHours}
                  onChange={(e) => setCancellationHours(Number(e.target.value))}
                  className={[
                    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none",
                    invalidCancellation
                      ? "border-red-400 focus:border-red-500"
                      : "border-neutral-300 focus:border-black",
                  ].join(" ")}
                />

                {invalidCancellation ? (
                  <p className="text-xs text-red-600">Debe estar entre 1 y 168 horas.</p>
                ) : (
                  <p className="text-xs text-neutral-500">
                    Ej: 3 = se mostrará “al menos 3 horas de anticipación”.
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => void onSaveReminder()}
                  disabled={saving || invalid}
                  className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 sm:w-auto"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-black">Información pública de la barbería</h2>

          <p className="text-sm text-neutral-600">
            Estos datos se usan en la web pública, header, footer y páginas de reserva.
          </p>
        </div>

        {loadingTenant ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            Cargando configuración de barbería...
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Campo
              label="Nombre de la barbería"
              value={tenantForm.name}
              onChange={(value) => updateTenantForm("name", value)}
              placeholder="Black & White Studio"
            />

            <Campo
              label="Dominio"
              value={tenant?.domain ?? ""}
              onChange={() => undefined}
              disabled
              placeholder="dominio.cl"
            />

            <Campo
              label="Instagram"
              value={tenantForm.instagramUrl}
              onChange={(value) => updateTenantForm("instagramUrl", value)}
              placeholder="https://www.instagram.com/tu_barberia"
            />

            <Campo
              label="Dirección o enlace Google Maps"
              value={tenantForm.address}
              onChange={(value) => updateTenantForm("address", value)}
              placeholder="Dirección o embed de Google Maps"
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-black">Personalización visual</h2>

        <p className="mt-1 text-sm text-neutral-600">
          Configura logo, imagen principal, colores y tipografía pública.
        </p>

        {loadingTenant ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            Cargando personalización...
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CampoImagen
                label="Logo"
                value={tenantForm.logoUrl}
                uploading={subiendoLogo}
                onUpload={(file) => void subirLogo(file)}
                onClear={() => updateTenantForm("logoUrl", "")}
              />

              <CampoImagen
                label="Imagen principal"
                value={tenantForm.heroImageUrl}
                uploading={subiendoHero}
                onUpload={(file) => void subirHero(file)}
                onClear={() => updateTenantForm("heroImageUrl", "")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <CampoColor
                label="Color primario"
                value={tenantForm.primaryColor}
                onChange={(value) => updateTenantForm("primaryColor", value)}
              />

              <CampoColor
                label="Color secundario"
                value={tenantForm.secondaryColor}
                onChange={(value) => updateTenantForm("secondaryColor", value)}
              />

              <CampoColor
                label="Header"
                value={tenantForm.headerColor}
                onChange={(value) => updateTenantForm("headerColor", value)}
              />

              <CampoColor
                label="Footer"
                value={tenantForm.footerColor}
                onChange={(value) => updateTenantForm("footerColor", value)}
              />
            </div>

            <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(280px,520px)_minmax(320px,1fr)]">
              <CampoTipografia
                value={tenantForm.fontFamily || FUENTE_TENANT_DEFAULT}
                onChange={(value) => updateTenantForm("fontFamily", value)}
                disabled={savingTenant}
              />

              <div className="flex h-full items-center justify-center">
                <VistaPreviaTipografia
                  nombre={tenantForm.name}
                  fontFamily={fuentePreview}
                  fuenteSeleccionada={tenantForm.fontFamily || FUENTE_TENANT_DEFAULT}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void onSaveTenant()}
                disabled={savingTenant || tenantInvalid}
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {savingTenant ? "Guardando..." : "Guardar configuración"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-neutral-600">{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black disabled:bg-neutral-100 disabled:text-neutral-500"
      />
    </div>
  );
}

function CampoColor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-neutral-600">{label}</label>

      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded border border-neutral-300 bg-white p-1"
        />

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs text-black uppercase outline-none focus:border-black"
        />
      </div>
    </div>
  );
}

function CampoImagen({
  label,
  value,
  uploading,
  onUpload,
  onClear,
}: {
  label: string;
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-neutral-600">{label}</label>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        {value ? (
          <div className="mb-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <img src={value} alt={label} className="h-40 w-full object-contain p-3" />
          </div>
        ) : (
          <div className="mb-3 flex h-40 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white text-sm text-neutral-500">
            Sin imagen cargada
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800">
            {uploading ? "Subiendo..." : "Subir imagen"}

            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (!file) return;

                onUpload(file);

                e.target.value = "";
              }}
            />
          </label>

          {value ? (
            <button
              type="button"
              onClick={onClear}
              disabled={uploading}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-100 disabled:opacity-50"
            >
              Quitar
            </button>
          ) : null}
        </div>

        {value ? <p className="mt-2 text-xs break-all text-neutral-500">{value}</p> : null}
      </div>
    </div>
  );
}

function CampoTipografia({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="block">
      <span className="text-xs font-semibold text-neutral-600">Tipografía</span>

      <div className="mt-2 max-h-[360px] overflow-y-auto rounded-2xl border border-neutral-300 bg-white p-2">
        <div className="grid gap-2">
          {FUENTES_TENANT.map((fuente) => {
            const activa = value === fuente.value;
            const fuentePreview = obtenerVariableFuente(fuente.value);

            return (
              <button
                key={fuente.value}
                type="button"
                disabled={disabled}
                onClick={() => onChange(fuente.value)}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  activa
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xl leading-tight" style={{ fontFamily: fuentePreview }}>
                      {fuente.label}
                    </p>

                    <p className={`mt-1 text-xs ${activa ? "text-white/70" : "text-neutral-500"}`}>
                      {fuente.descripcion}
                    </p>
                  </div>

                  {activa ? (
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-neutral-950">
                      Activa
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VistaPreviaTipografia({
  nombre,
  fontFamily,
  fuenteSeleccionada,
}: {
  nombre: string;
  fontFamily: string;
  fuenteSeleccionada: string;
}) {
  return (
    <div className="w-full max-w-[360px] rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
      <p className="text-center text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
        Vista previa tipográfica
      </p>

      <p
        className="mt-3 line-clamp-1 text-center text-2xl font-semibold text-neutral-950"
        style={{ fontFamily }}
      >
        {nombre?.trim() || "Nombre de la barbería"}
      </p>

      <p className="mt-2 line-clamp-2 text-center text-sm text-neutral-600" style={{ fontFamily }}>
        Reserva con tu barbero de confianza.
      </p>

      <p className="mt-3 text-center text-xs text-neutral-500">
        Fuente: <span className="font-semibold text-neutral-800">{fuenteSeleccionada}</span>
      </p>
    </div>
  );
}
