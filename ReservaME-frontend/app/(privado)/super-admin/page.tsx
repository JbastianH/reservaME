"use client";

import { useEffect, useMemo, useState } from "react";
import GuardiaAuth from "@/componentes/auth/GuardAuth";
import {
  activarTenantSuperAdmin,
  desactivarTenantSuperAdmin,
  listarTenantsSuperAdmin,
  reenviarActivacionTenantSuperAdmin,
  type SuperAdminTenant,
} from "@/services/super-admin-tenants.service";
import type { ApiError } from "@/lib/api";
import SuperAdminTopbar from "@/componentes/super-admin/SuperAdminTopBar";
import CrearBarberiaModal from "@/componentes/super-admin/CrearBarberiaModal";
import EditarBarberiaModal from "@/componentes/super-admin/EditarBarberiaModal";
import DetalleBarberiaModal from "@/componentes/super-admin/DetalleBarberiaModal";
import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

const TENANTS_POR_PAGINA = 5;

export default function SuperAdminPage() {
  return (
    <GuardiaAuth rolesPermitidos={["SUPER_ADMIN"]}>
      <SuperAdminPanel />
    </GuardiaAuth>
  );
}

function formatearUbicacion(address?: string | null) {
  if (!address) return "Sin ubicación";

  const addressLimpia = address.trim();

  if (
    addressLimpia.startsWith("https://www.google.com/maps/embed") ||
    addressLimpia.startsWith("https://maps.google.com/maps")
  ) {
    return "Mapa configurado";
  }

  return addressLimpia;
}

function SuperAdminPanel() {
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [reenviandoId, setReenviandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [paginaActual, setPaginaActual] = useState(1);

  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [tenantEditando, setTenantEditando] = useState<SuperAdminTenant | null>(null);
  const [tenantDetalle, setTenantDetalle] = useState<SuperAdminTenant | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: "default" | "danger" | "warning";
    onConfirm: (() => void) | null;
  }>({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    variant: "default",
    onConfirm: null,
  });

  const [feedbackDialog, setFeedbackDialog] = useState<{
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

  const totalActivos = useMemo(() => tenants.filter((tenant) => tenant.isActive).length, [tenants]);

  const totalInactivos = useMemo(
    () => tenants.filter((tenant) => !tenant.isActive).length,
    [tenants],
  );

  const totalPaginas = useMemo(() => {
    return Math.max(1, Math.ceil(tenants.length / TENANTS_POR_PAGINA));
  }, [tenants.length]);

  const tenantsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * TENANTS_POR_PAGINA;
    const fin = paginaActual * TENANTS_POR_PAGINA;

    return tenants.slice(inicio, fin);
  }, [tenants, paginaActual]);

  async function cargarTenants() {
    try {
      setLoading(true);
      setError(null);

      const data = await listarTenantsSuperAdmin();

      setTenants(data);
      setPaginaActual(1);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "No se pudieron cargar las barberías.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTenantCreado() {
    await cargarTenants();

    setFeedbackDialog({
      open: true,
      title: "Barbería creada",
      message: "La barbería fue creada correctamente y se envió el correo de activación.",
      variant: "success",
    });
  }

  async function handleTenantActualizado() {
    await cargarTenants();

    setFeedbackDialog({
      open: true,
      title: "Cambios guardados",
      message: "La barbería fue actualizada correctamente.",
      variant: "success",
    });
  }

  async function cambiarEstadoTenant(tenant: SuperAdminTenant) {
    try {
      setActionLoadingId(tenant.id);
      setError(null);

      if (tenant.isActive) {
        await desactivarTenantSuperAdmin(tenant.id);
      } else {
        await activarTenantSuperAdmin(tenant.id);
      }

      await cargarTenants();

      setFeedbackDialog({
        open: true,
        title: tenant.isActive ? "Barbería desactivada" : "Barbería activada",
        message: `La barbería ${tenant.name} fue ${
          tenant.isActive ? "desactivada" : "activada"
        } correctamente.`,
        variant: "success",
      });
    } catch (err) {
      const apiError = err as ApiError;

      setFeedbackDialog({
        open: true,
        title: "No se pudo cambiar el estado",
        message: apiError.message ?? "Ocurrió un error al cambiar el estado.",
        variant: "error",
      });
    } finally {
      setActionLoadingId(null);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  }

  async function reenviarActivacion(tenant: SuperAdminTenant) {
    const admin = tenant.users[0];

    if (!admin) {
      setConfirmDialog((prev) => ({ ...prev, open: false }));

      setFeedbackDialog({
        open: true,
        title: "No se pudo reenviar",
        message: "Esta barbería no tiene un admin asociado.",
        variant: "error",
      });

      return;
    }

    if (admin.isActive) {
      setConfirmDialog((prev) => ({ ...prev, open: false }));

      setFeedbackDialog({
        open: true,
        title: "Cuenta ya activa",
        message: "El admin de esta barbería ya tiene su cuenta activa.",
        variant: "info",
      });

      return;
    }

    try {
      setReenviandoId(tenant.id);
      setError(null);

      await reenviarActivacionTenantSuperAdmin(tenant.id);

      setFeedbackDialog({
        open: true,
        title: "Correo reenviado",
        message: `El correo de activación fue reenviado correctamente a ${admin.email}.`,
        variant: "success",
      });
    } catch (err) {
      const apiError = err as ApiError;

      setFeedbackDialog({
        open: true,
        title: "No se pudo reenviar",
        message: apiError.message ?? "No se pudo reenviar la activación.",
        variant: "error",
      });
    } finally {
      setReenviandoId(null);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  }

  function irPaginaAnterior() {
    setPaginaActual((prev) => Math.max(1, prev - 1));
  }

  function irPaginaSiguiente() {
    setPaginaActual((prev) => Math.min(totalPaginas, prev + 1));
  }

  useEffect(() => {
    void cargarTenants();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 text-neutral-950 sm:px-6 lg:px-8">
      <SuperAdminTopbar />

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-2 pb-8">
        <header className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-950">
              Panel Super Admin
            </h1>

            <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600">
              Gestiona las barberías registradas en la plataforma, sus dominios, estado general y
              administrador principal.
            </p>
          </div>
        </header>

        <div className="flex justify-start">
          <button
            type="button"
            className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            onClick={() => setModalCrearOpen(true)}
          >
            + Crear barbería
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <ResumenCard titulo="Barberías" valor={tenants.length} />
          <ResumenCard titulo="Activas" valor={totalActivos} />
          <ResumenCard titulo="Inactivas" valor={totalInactivos} />
        </section>

        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-neutral-200 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-950">Barberías registradas</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Listado global de barberías creadas en ReservaME.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void cargarTenants()}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
            >
              Actualizar
            </button>
          </div>

          {error ? (
            <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="p-6 text-sm text-neutral-500">Cargando barberías...</div>
          ) : tenants.length === 0 ? (
            <div className="p-6 text-sm text-neutral-500">
              Todavía no hay barberías registradas.
            </div>
          ) : (
            <>
              {/* Vista móvil */}
              <div className="grid gap-4 p-4 md:hidden">
                {tenantsPaginados.map((tenant) => {
                  const admin = tenant.users[0];
                  const accionLoading = actionLoadingId === tenant.id;
                  const reenviando = reenviandoId === tenant.id;

                  return (
                    <article
                      key={tenant.id}
                      onClick={() => setTenantDetalle(tenant)}
                      className="cursor-pointer rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:bg-neutral-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-neutral-950">
                            {tenant.name}
                          </h3>
                          <p className="mt-1 truncate text-sm text-neutral-500">
                            {tenant.email ?? "Sin correo de contacto"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                            tenant.isActive
                              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                              : "bg-red-50 text-red-700 ring-1 ring-red-200"
                          }`}
                        >
                          {tenant.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3 text-sm">
                        <div>
                          <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Dominio
                          </p>
                          <p className="mt-1 truncate text-neutral-700">{tenant.domain}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Admin
                          </p>
                          <p className="mt-1 truncate text-neutral-800">
                            {admin?.email ?? "Sin admin"}
                          </p>
                          {admin ? (
                            <p className="mt-1 text-xs text-neutral-500">
                              {admin.isActive ? "Cuenta activa" : "Pendiente de activar"}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                            Ubicación
                          </p>
                          <p className="mt-1 truncate text-neutral-700">
                            {formatearUbicacion(tenant.address)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {admin && !admin.isActive ? (
                          <button
                            type="button"
                            disabled={reenviando}
                            onClick={(e) => {
                              e.stopPropagation();

                              setConfirmDialog({
                                open: true,
                                title: "Reenviar activación",
                                message: `¿Quieres reenviar el correo de activación a ${admin.email}?`,
                                confirmText: "Reenviar",
                                variant: "warning",
                                onConfirm: () => void reenviarActivacion(tenant),
                              });
                            }}
                            className="rounded-full border border-yellow-300 bg-yellow-50 px-4 py-2 text-xs font-semibold text-yellow-800 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {reenviando ? "Reenviando..." : "Reenviar activación"}
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTenantEditando(tenant);
                          }}
                          className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-100"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={accionLoading}
                          onClick={(e) => {
                            e.stopPropagation();

                            setConfirmDialog({
                              open: true,
                              title: tenant.isActive ? "Desactivar barbería" : "Activar barbería",
                              message: `¿Seguro que deseas ${
                                tenant.isActive ? "desactivar" : "activar"
                              } la barbería ${tenant.name}?`,
                              confirmText: tenant.isActive ? "Desactivar" : "Activar",
                              variant: tenant.isActive ? "danger" : "default",
                              onConfirm: () => void cambiarEstadoTenant(tenant),
                            });
                          }}
                          className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {accionLoading
                            ? "Procesando..."
                            : tenant.isActive
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Vista desktop */}
              <div className="hidden md:block">
                <table className="w-full table-fixed border-collapse text-left text-sm">
                  <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-500 uppercase">
                    <tr>
                      <th className="w-[19%] px-5 py-4 font-semibold">Barbería</th>
                      <th className="w-[16%] px-5 py-4 font-semibold">Dominio</th>
                      <th className="w-[20%] px-5 py-4 font-semibold">Admin</th>
                      <th className="w-[17%] px-5 py-4 font-semibold">Ubicación</th>
                      <th className="w-[10%] px-5 py-4 font-semibold">Estado</th>
                      <th className="w-[18%] px-5 py-4 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-200">
                    {tenantsPaginados.map((tenant) => {
                      const admin = tenant.users[0];
                      const accionLoading = actionLoadingId === tenant.id;
                      const reenviando = reenviandoId === tenant.id;

                      return (
                        <tr
                          key={tenant.id}
                          onClick={() => setTenantDetalle(tenant)}
                          className="cursor-pointer hover:bg-neutral-50/70"
                        >
                          <td className="px-5 py-4">
                            <div className="truncate font-semibold text-neutral-950">
                              {tenant.name}
                            </div>
                            <div className="mt-1 truncate text-xs text-neutral-500">
                              {tenant.email ?? "Sin correo de contacto"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="block truncate rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                              {tenant.domain}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="truncate text-neutral-800">
                              {admin?.email ?? "Sin admin"}
                            </div>

                            {admin ? (
                              <div className="mt-1 truncate text-xs text-neutral-500">
                                {admin.isActive ? "Cuenta activa" : "Pendiente de activar"}
                              </div>
                            ) : null}
                          </td>

                          <td className="px-5 py-4 text-neutral-600">
                            <span className="block truncate">
                              {formatearUbicacion(tenant.address)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                tenant.isActive
                                  ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                  : "bg-red-50 text-red-700 ring-1 ring-red-200"
                              }`}
                            >
                              {tenant.isActive ? "Activa" : "Inactiva"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              {admin && !admin.isActive ? (
                                <button
                                  type="button"
                                  disabled={reenviando}
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    setConfirmDialog({
                                      open: true,
                                      title: "Reenviar activación",
                                      message: `¿Quieres reenviar el correo de activación a ${admin.email}?`,
                                      confirmText: "Reenviar",
                                      variant: "warning",
                                      onConfirm: () => void reenviarActivacion(tenant),
                                    });
                                  }}
                                  className="rounded-full border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {reenviando ? "Reenviando..." : "Reenviar"}
                                </button>
                              ) : null}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTenantEditando(tenant);
                                }}
                                className="rounded-full border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-100"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                disabled={accionLoading}
                                onClick={(e) => {
                                  e.stopPropagation();

                                  setConfirmDialog({
                                    open: true,
                                    title: tenant.isActive
                                      ? "Desactivar barbería"
                                      : "Activar barbería",
                                    message: `¿Seguro que deseas ${
                                      tenant.isActive ? "desactivar" : "activar"
                                    } la barbería ${tenant.name}?`,
                                    confirmText: tenant.isActive ? "Desactivar" : "Activar",
                                    variant: tenant.isActive ? "danger" : "default",
                                    onConfirm: () => void cambiarEstadoTenant(tenant),
                                  });
                                }}
                                className="rounded-full border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {accionLoading ? "..." : tenant.isActive ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {tenants.length > TENANTS_POR_PAGINA ? (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-200 px-6 py-4 sm:flex-row">
                  <p className="text-sm text-neutral-500">
                    Página {paginaActual} de {totalPaginas}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={paginaActual === 1}
                      onClick={irPaginaAnterior}
                      className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Anterior
                    </button>

                    <button
                      type="button"
                      disabled={paginaActual === totalPaginas}
                      onClick={irPaginaSiguiente}
                      className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <CrearBarberiaModal
        open={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        onCreated={handleTenantCreado}
      />

      <EditarBarberiaModal
        open={Boolean(tenantEditando)}
        tenant={tenantEditando}
        onClose={() => setTenantEditando(null)}
        onUpdated={handleTenantActualizado}
      />

      <DetalleBarberiaModal
        open={Boolean(tenantDetalle)}
        tenant={tenantDetalle}
        onClose={() => setTenantDetalle(null)}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        loading={Boolean(actionLoadingId || reenviandoId)}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={() => confirmDialog.onConfirm?.()}
      />

      <FeedbackDialog
        open={feedbackDialog.open}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        variant={feedbackDialog.variant}
        onClose={() => setFeedbackDialog((prev) => ({ ...prev, open: false }))}
      />
    </main>
  );
}

function ResumenCard({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{titulo}</p>
      <p className="mt-3 text-3xl font-bold text-neutral-950">{valor}</p>
    </article>
  );
}
