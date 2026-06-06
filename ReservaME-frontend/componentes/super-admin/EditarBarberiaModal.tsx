"use client";

import { useEffect, useState } from "react";
import {
  actualizarTenantSuperAdmin,
  type ActualizarTenantPayload,
  type SuperAdminTenant,
} from "@/services/super-admin-tenants.service";
import type { ApiError } from "@/lib/api";
import ConfirmDialog from "@/componentes/ui/ConfirmDialog";

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
  primaryColor: "#000000",
  secondaryColor: "#FFFFFF",
  headerColor: "#000000",
  footerColor: "#000000",
  fontFamily: "Inter",
  isActive: true,
};

export default function EditarBarberiaModal({
  open,
  tenant,
  onClose,
  onUpdated,
}: Props) {
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
      primaryColor: tenant.settings?.primaryColor ?? "#000000",
      secondaryColor: tenant.settings?.secondaryColor ?? "#FFFFFF",
      headerColor: tenant.settings?.headerColor ?? "#000000",
      footerColor: tenant.settings?.footerColor ?? "#000000",
      fontFamily: tenant.settings?.fontFamily ?? "Inter",
      isActive: tenant.isActive,
    });

    setError(null);
    setConfirmOpen(false);
  }, [tenant]);

  if (!open || !tenant) return null;

  const tenantId = tenant.id;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validarFormulario() {
    if (!form.name.trim()) return "El nombre de la barbería es obligatorio.";
    if (form.name.trim().length < 2) {
      return "El nombre debe tener al menos 2 caracteres.";
    }

    if (!form.domain.trim()) return "El dominio es obligatorio.";
    if (form.domain.includes(" ")) return "El dominio no puede contener espacios.";

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
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        headerColor: form.headerColor,
        footerColor: form.footerColor,
        fontFamily: form.fontFamily.trim() || "Inter",
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
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-950">
                Editar barbería
              </h2>
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
            <p className="mt-1 text-xs text-neutral-500">
              Este correo no se edita desde aquí.
            </p>
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
                <Campo
                  label="Dirección"
                  value={form.address}
                  onChange={(value) => update("address", value)}
                  placeholder="Valparaíso, Chile"
                />
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
          className="min-w-0 flex-1 bg-transparent text-sm uppercase text-neutral-800 outline-none"
        />

        <div
          className="h-8 w-8 shrink-0 rounded-full border border-neutral-300"
          style={{ backgroundColor: value }}
        />
      </div>
    </label>
  );
}