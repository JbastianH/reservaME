"use client";

import { useState } from "react";
import {
  crearTenantSuperAdmin,
  type CrearTenantPayload,
} from "@/services/super-admin-tenants.service";
import type { ApiError } from "@/lib/api";
import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import { FUENTES_TENANT, FUENTE_TENANT_DEFAULT } from "@/lib/fuentes-tenant";
import { obtenerVariableFuente } from "@/lib/fuentes-css";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
};

const initialForm: CrearTenantPayload = {
  name: "",
  domain: "",
  adminEmail: "",
  address: "",
  instagramUrl: "",
  primaryColor: "#000000",
  secondaryColor: "#FFFFFF",
  headerColor: "#000000",
  footerColor: "#000000",
  fontFamily: FUENTE_TENANT_DEFAULT,
  isActive: true,
};

export default function CrearBarberiaModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CrearTenantPayload>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!open) return null;

  const fuentePreview = obtenerVariableFuente(form.fontFamily);

  function update<K extends keyof CrearTenantPayload>(key: K, value: CrearTenantPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validarFormulario() {
    const errores: string[] = [];

    if (!form.name.trim()) errores.push("El nombre de la barbería es obligatorio.");
    if (form.name.trim().length < 2) {
      errores.push("El nombre debe tener al menos 2 caracteres.");
    }

    if (!form.domain.trim()) errores.push("El dominio es obligatorio.");
    if (form.domain.includes(" ")) errores.push("El dominio no puede contener espacios.");

    if (!form.adminEmail.trim()) errores.push("El correo admin es obligatorio.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim())) {
      errores.push("El correo admin no tiene un formato válido.");
    }

    return errores[0] ?? null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setError(null);
    setConfirmOpen(true);
  }

  async function confirmarCreacion() {
    try {
      setLoading(true);
      setError(null);

      const payload: CrearTenantPayload = {
        name: form.name.trim(),
        domain: form.domain.trim(),
        adminEmail: form.adminEmail.trim(),
        address: form.address?.trim() || undefined,
        instagramUrl: form.instagramUrl?.trim() || undefined,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        headerColor: form.headerColor,
        footerColor: form.footerColor,
        fontFamily: form.fontFamily?.trim() || FUENTE_TENANT_DEFAULT,
        isActive: form.isActive ?? true,
      };

      await crearTenantSuperAdmin(payload);

      setForm(initialForm);
      setConfirmOpen(false);
      await onCreated();
      onClose();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "No se pudo crear la barbería.");
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setConfirmOpen(false);
    setError(null);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-950">Crear barbería</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Se creará el tenant, configuración inicial y admin principal.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-full border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                label="Nombre barbería"
                value={form.name}
                onChange={(v) => update("name", v)}
                required
              />

              <Campo
                label="Dominio"
                value={form.domain}
                onChange={(v) => update("domain", v)}
                placeholder="Sin protocolo ni www, ej: barberia-fade.com"
                required
              />

              <Campo
                label="Correo admin"
                value={form.adminEmail}
                onChange={(v) => update("adminEmail", v)}
                type="email"
                required
              />

              <Campo
                label="Dirección"
                value={form.address ?? ""}
                onChange={(v) => update("address", v)}
                placeholder="Enlace Google Maps"
              />

              <Campo
                label="Instagram"
                value={form.instagramUrl ?? ""}
                onChange={(v) => update("instagramUrl", v)}
                placeholder="https://www.instagram.com/tu_barberia"
              />

              <div className="grid items-center gap-4 sm:col-span-2 lg:grid-cols-[minmax(280px,420px)_minmax(260px,360px)]">
                <CampoTipografia
                  value={form.fontFamily ?? FUENTE_TENANT_DEFAULT}
                  onChange={(value) => update("fontFamily", value)}
                  disabled={loading}
                />

                <div className="flex justify-center lg:justify-start">
                  <VistaPreviaTipografia
                    nombre={form.name}
                    fontFamily={fuentePreview}
                    fuenteSeleccionada={form.fontFamily ?? FUENTE_TENANT_DEFAULT}
                  />
                </div>
              </div>

              <CampoColor
                label="Color primario"
                value={form.primaryColor ?? "#000000"}
                onChange={(v) => update("primaryColor", v)}
              />

              <CampoColor
                label="Color secundario"
                value={form.secondaryColor ?? "#FFFFFF"}
                onChange={(v) => update("secondaryColor", v)}
              />

              <CampoColor
                label="Header"
                value={form.headerColor ?? "#000000"}
                onChange={(v) => update("headerColor", v)}
              />

              <CampoColor
                label="Footer"
                value={form.footerColor ?? "#000000"}
                onChange={(v) => update("footerColor", v)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                Crear barbería
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Crear barbería"
        message={`¿Confirmas crear la barbería "${form.name.trim()}" con el dominio "${form.domain.trim()}"? Se enviará un correo de activación a ${form.adminEmail.trim()}.`}
        confirmText="Crear barbería"
        variant="default"
        loading={loading}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void confirmarCreacion()}
      />
    </>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
      />
    </label>
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
        {nombre.trim() || "Nombre de la barbería"}
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
    <label className="block">
      <span className="text-xs font-semibold text-neutral-600">{label}</span>

      <div className="mt-1 flex items-center gap-3 rounded-xl border border-neutral-300 px-3 py-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-800 uppercase outline-none"
        />

        <div
          className="h-8 w-8 shrink-0 rounded-full border border-neutral-300"
          style={{ backgroundColor: value }}
        />
      </div>
    </label>
  );
}
