"use client";

import { useEffect, useState } from "react";
import {
  actualizarTenantSuperAdmin,
  type ActualizarTenantPayload,
  type SuperAdminTenant,
} from "@/services/super-admin-tenants.service";
import type { ApiError } from "@/lib/api";
import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import { FUENTES_TENANT, FUENTE_TENANT_DEFAULT } from "@/lib/fuentes-tenant";
import { obtenerVariableFuente } from "@/lib/fuentes-css";

type Props = {
  open: boolean;
  tenant: SuperAdminTenant | null;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
};

type FormState = {
  name: string;
  domain: string;
  address: string;
  instagramUrl: string;
  primaryColor: string;
  secondaryColor: string;
  headerColor: string;
  footerColor: string;
  fontFamily: string;
  isActive: boolean;
};

const initialForm: FormState = {
  name: "",
  domain: "",
  address: "",
  instagramUrl: "",
  primaryColor: "#000000",
  secondaryColor: "#FFFFFF",
  headerColor: "#000000",
  footerColor: "#000000",
  fontFamily: FUENTE_TENANT_DEFAULT,
  isActive: true,
};

export default function EditarBarberiaModal({ open, tenant, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const adminEmail = tenant?.users[0]?.email ?? tenant?.email ?? "Sin admin";

  useEffect(() => {
    if (!tenant) return;

    setForm({
      name: tenant.name,
      domain: tenant.domain,
      address: tenant.address ?? "",
      instagramUrl: tenant.instagramUrl ?? "",
      primaryColor: tenant.settings?.primaryColor ?? "#000000",
      secondaryColor: tenant.settings?.secondaryColor ?? "#FFFFFF",
      headerColor: tenant.settings?.headerColor ?? "#000000",
      footerColor: tenant.settings?.footerColor ?? "#000000",
      fontFamily: tenant.settings?.fontFamily ?? FUENTE_TENANT_DEFAULT,
      isActive: tenant.isActive,
    });

    setError(null);
    setConfirmOpen(false);
  }, [tenant]);

  if (!open || !tenant) return null;

  const tenantId = tenant.id;
  const fuentePreview = obtenerVariableFuente(form.fontFamily);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validarFormulario() {
    if (!form.name.trim()) return "El nombre de la barbería es obligatorio.";

    if (form.name.trim().length < 2) {
      return "El nombre debe tener al menos 2 caracteres.";
    }

    if (!form.domain.trim()) return "El dominio es obligatorio.";

    if (form.domain.includes(" ")) {
      return "El dominio no puede contener espacios.";
    }

    return null;
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

  async function confirmarEdicion() {
    try {
      setLoading(true);
      setError(null);

      const payload: ActualizarTenantPayload = {
        name: form.name.trim(),
        domain: form.domain.trim(),
        address: form.address.trim() || undefined,
        instagramUrl: form.instagramUrl.trim(),
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        headerColor: form.headerColor,
        footerColor: form.footerColor,
        fontFamily: form.fontFamily.trim() || FUENTE_TENANT_DEFAULT,
        isActive: form.isActive,
      };

      await actualizarTenantSuperAdmin(tenantId, payload);

      setConfirmOpen(false);
      await onUpdated();
      onClose();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "No se pudo actualizar la barbería.");
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
              <h2 className="text-xl font-bold text-neutral-950">Editar barbería</h2>

              <p className="mt-1 text-sm text-neutral-500">
                Modifica los datos principales de la barbería seleccionada.
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

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-semibold text-neutral-600">Correo admin</p>

            <p className="mt-1 text-sm text-neutral-900">{adminEmail}</p>

            <p className="mt-1 text-xs text-neutral-500">Este correo no se edita desde aquí.</p>
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
                onChange={(value) => update("name", value)}
                required
              />

              <Campo
                label="Dominio"
                value={form.domain}
                onChange={(value) => update("domain", value)}
                placeholder="black.localhost"
                required
              />
              <div className="sm:col-span-2">
                <CampoTextoLargo
                  label="Dirección o enlace Google Maps"
                  value={form.address}
                  onChange={(value) => update("address", value)}
                  placeholder="Pega aquí una dirección o enlace embed de Google Maps"
                />
              </div>

              <div className="sm:col-span-2">
                <Campo
                  label="Instagram"
                  value={form.instagramUrl}
                  onChange={(value) => update("instagramUrl", value)}
                  placeholder="https://www.instagram.com/tu_barberia"
                />
              </div>

              <div className="grid items-center gap-4 sm:col-span-2 lg:grid-cols-[minmax(280px,420px)_minmax(260px,360px)]">
                <CampoTipografia
                  value={form.fontFamily}
                  onChange={(value) => update("fontFamily", value)}
                  disabled={loading}
                />

                <div className="flex justify-center lg:justify-start">
                  <VistaPreviaTipografia
                    nombre={form.name}
                    fontFamily={fuentePreview}
                    fuenteSeleccionada={form.fontFamily}
                  />
                </div>
              </div>

              <CampoColor
                label="Color primario"
                value={form.primaryColor}
                onChange={(value) => update("primaryColor", value)}
              />

              <CampoColor
                label="Color secundario"
                value={form.secondaryColor}
                onChange={(value) => update("secondaryColor", value)}
              />

              <CampoColor
                label="Header"
                value={form.headerColor}
                onChange={(value) => update("headerColor", value)}
              />

              <CampoColor
                label="Footer"
                value={form.footerColor}
                onChange={(value) => update("footerColor", value)}
              />
            </div>

            <label className="flex items-center gap-2 rounded-2xl border border-neutral-200 p-3 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => update("isActive", e.target.checked)}
              />
              Barbería activa
            </label>

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
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Guardar cambios"
        message={`¿Confirmas guardar los cambios de la barbería "${form.name.trim()}"?`}
        confirmText="Guardar cambios"
        variant="default"
        loading={loading}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void confirmarEdicion()}
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

function CampoTextoLargo({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-neutral-600">{label}</span>

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full resize-none rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
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
