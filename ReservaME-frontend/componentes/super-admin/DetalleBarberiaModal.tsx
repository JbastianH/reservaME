"use client";

import type { SuperAdminTenant } from "@/services/super-admin-tenants.service";

type Props = {
  open: boolean;
  tenant: SuperAdminTenant | null;
  onClose: () => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DetalleBarberiaModal({ open, tenant, onClose }: Props) {
  if (!open || !tenant) return null;

  const admin = tenant.users[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950">
              Detalle de barbería
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Información general del tenant seleccionado.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetalleItem label="Nombre" value={tenant.name} />
          <DetalleItem label="Dominio" value={tenant.domain} />
          <DetalleItem label="Correo contacto" value={tenant.email ?? "Sin correo"} />
          <DetalleItem label="Correo admin" value={admin?.email ?? "Sin admin"} />
          <DetalleItem label="Dirección" value={tenant.address ?? "Sin dirección"} />
          <DetalleItem label="Estado" value={tenant.isActive ? "Activa" : "Inactiva"} />
          <DetalleItem label="Creada" value={formatDate(tenant.createdAt)} />
          <DetalleItem label="Actualizada" value={formatDate(tenant.updatedAt)} />
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            Configuración visual
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ColorItem label="Primario" value={tenant.settings?.primaryColor ?? "#000000"} />
            <ColorItem label="Secundario" value={tenant.settings?.secondaryColor ?? "#FFFFFF"} />
            <ColorItem label="Header" value={tenant.settings?.headerColor ?? "#000000"} />
            <ColorItem label="Footer" value={tenant.settings?.footerColor ?? "#000000"} />
          </div>

          <div className="mt-4">
            <DetalleItem
              label="Tipografía"
              value={tenant.settings?.fontFamily ?? "Inter"}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function DetalleItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-3">
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      <p className="mt-1 break-words text-sm text-neutral-950">{value}</p>
    </div>
  );
}

function ColorItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-3">
      <div>
        <p className="text-xs font-semibold text-neutral-500">{label}</p>
        <p className="mt-1 text-sm uppercase text-neutral-950">{value}</p>
      </div>

      <div
        className="h-9 w-9 rounded-full border border-neutral-300"
        style={{ backgroundColor: value }}
      />
    </div>
  );
}