"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiError } from "@/lib/api";
import {
  activarServicioAdmin,
  actualizarServicioAdmin,
  crearServicioAdmin,
  desactivarServicioAdmin,
  getAdminServicios,
} from "@/services/servicios.service";

import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

type ServicioItem = {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string; // ISO
};

type FormState = {
  nombre: string;
  descripcion: string;
};

type ToggleServicioTarget = {
  id: string;
  nombre: string;
  nextActivo: boolean;
};

export default function AdminServiciosPage() {
  // ✅ Ahora viene desde backend (parte vacío)
  const [servicios, setServicios] = useState<ServicioItem[]>([]);

  // loading/error backend
  const [loading, setLoading] = useState(true);
  const [accionId, setAccionId] = useState<string | null>(null);

  // Filtros
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"TODOS" | "ACTIVOS" | "INACTIVOS">("TODOS");

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ nombre: "", descripcion: "" });
  const [touched, setTouched] = useState<{ nombre: boolean }>({ nombre: false });

  const [loadError, setLoadError] = useState("");

  const [toggleTarget, setToggleTarget] = useState<ToggleServicioTarget | null>(null);

  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    title: "",
    message: "",
    variant: "success" as "success" | "error",
  });

  function mapearError(err: unknown): string {
    const e = err as Partial<ApiError> | undefined;
    if (e?.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
    if (e?.status === 403) return "No autorizado.";
    return e?.message ?? "Ocurrió un error.";
  }

  async function refetchServicios() {
    setLoading(true);
    setLoadError("");

    try {
      const res = await getAdminServicios();

      const mapped: ServicioItem[] = res.map((s) => ({
        id: s.id,
        nombre: s.name,
        descripcion: s.description ?? undefined,
        activo: s.isActive,
        createdAt: s.createdAt,
      }));

      setServicios(mapped);
    } catch (err) {
      setLoadError(mapearError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refetchServicios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nombreError = useMemo(() => {
    if (!touched.nombre) return "";
    const v = form.nombre.trim();
    if (!v) return "El nombre es obligatorio.";
    if (v.length < 3) return "El nombre debe tener al menos 3 caracteres.";
    return "";
  }, [form.nombre, touched.nombre]);

  const canSave = !nombreError && form.nombre.trim().length > 0;

  const serviciosFiltrados = useMemo(() => {
    const query = q.trim().toLowerCase();

    return servicios
      .filter((s) => {
        if (estado === "ACTIVOS" && !s.activo) return false;
        if (estado === "INACTIVOS" && s.activo) return false;

        if (query) {
          const text = `${s.nombre} ${s.descripcion ?? ""}`.toLowerCase();
          if (!text.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [servicios, q, estado]);

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

  function abrirCrear() {
    setEditId(null);
    setForm({ nombre: "", descripcion: "" });
    setTouched({ nombre: false });
    setModalOpen(true);
  }

  function abrirEditar(item: ServicioItem) {
    setEditId(item.id);
    setForm({ nombre: item.nombre, descripcion: item.descripcion ?? "" });
    setTouched({ nombre: false });
    setModalOpen(true);
  }

  function cerrarModal() {
    setModalOpen(false);
    setEditId(null);
    setTouched({ nombre: false });
  }

  async function guardar() {
    setTouched({ nombre: true });

    if (!canSave) {
      mostrarFeedback({
        title: "Campos inválidos",
        message: "Revisa los campos marcados antes de guardar.",
        variant: "error",
      });
      return;
    }

    const payloadNombre = form.nombre.trim();
    const payloadDesc = form.descripcion.trim();

    const existe = servicios.some(
      (s) =>
        s.nombre.toLowerCase() === payloadNombre.toLowerCase() && (editId ? s.id !== editId : true),
    );

    if (existe) {
      mostrarFeedback({
        title: "Servicio duplicado",
        message: "Ya existe un servicio con ese nombre.",
        variant: "error",
      });
      return;
    }

    try {
      setAccionId(editId ?? "create");

      if (!editId) {
        await crearServicioAdmin({
          name: payloadNombre,
          description: payloadDesc ? payloadDesc : null,
        });

        setModalOpen(false);

        mostrarFeedback({
          title: "Servicio creado",
          message: "El servicio fue creado correctamente.",
          variant: "success",
        });

        await refetchServicios();
        return;
      }

      await actualizarServicioAdmin(editId, {
        name: payloadNombre,
        description: payloadDesc ? payloadDesc : null,
      });

      setModalOpen(false);

      mostrarFeedback({
        title: "Servicio actualizado",
        message: "Los cambios del servicio fueron guardados correctamente.",
        variant: "success",
      });

      await refetchServicios();
    } catch (err) {
      mostrarFeedback({
        title: "No se pudo guardar",
        message: mapearError(err),
        variant: "error",
      });
    } finally {
      setAccionId(null);
    }
  }

  function pedirToggle(item: ServicioItem) {
    setToggleTarget({
      id: item.id,
      nombre: item.nombre,
      nextActivo: !item.activo,
    });
  }

  function cancelarToggle() {
    if (accionId === toggleTarget?.id) return;
    setToggleTarget(null);
  }

  async function confirmarToggle() {
    if (!toggleTarget) return;

    try {
      setAccionId(toggleTarget.id);

      if (toggleTarget.nextActivo) {
        await activarServicioAdmin(toggleTarget.id);
      } else {
        await desactivarServicioAdmin(toggleTarget.id);
      }

      setToggleTarget(null);

      mostrarFeedback({
        title: toggleTarget.nextActivo ? "Servicio activado" : "Servicio desactivado",
        message: toggleTarget.nextActivo
          ? "El servicio volverá a estar disponible."
          : "El servicio ya no estará disponible para nuevas asignaciones o reservas.",
        variant: "success",
      });

      await refetchServicios();
    } catch (err) {
      mostrarFeedback({
        title: "No se pudo actualizar",
        message: mapearError(err),
        variant: "error",
      });
    } finally {
      setAccionId(null);
    }
  }

  function pillActivo(activo: boolean) {
    return activo
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
      : "bg-neutral-500/10 text-neutral-700 border-neutral-500/30";
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Servicios</h1>
          <p className="mt-1 text-sm text-neutral-600">Administra los servicios disponibles.</p>
        </div>

        <button
          onClick={abrirCrear}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          + Crear servicio
        </button>
      </div>

      {/* Banners */}
      {loadError ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {/* Loading */}
      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          Cargando servicios...
        </div>
      ) : null}

      {/* Filtros */}
      {!loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-neutral-600">Buscar</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre o descripción..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none placeholder:text-neutral-400 focus:border-black"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-600">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as typeof estado)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVOS">Activos</option>
                <option value="INACTIVOS">Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop: tabla */}
      {!loading ? (
        <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-600">
              <tr>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {serviciosFiltrados.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-500" colSpan={3}>
                    No hay servicios con esos filtros.
                  </td>
                </tr>
              ) : (
                serviciosFiltrados.map((s) => (
                  <tr key={s.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-black">{s.nombre}</div>
                      <div className="text-xs text-neutral-500">{s.descripcion ?? "—"}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${pillActivo(
                          s.activo,
                        )}`}
                      >
                        {s.activo ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => abrirEditar(s)}
                          disabled={accionId === s.id}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-black hover:bg-neutral-50 disabled:opacity-50"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => pedirToggle(s)}
                          disabled={accionId === s.id}
                          className={[
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                            s.activo
                              ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
                              : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50",
                          ].join(" ")}
                        >
                          {s.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Mobile: cards */}
      {!loading ? (
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {serviciosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
              No hay servicios con esos filtros.
            </div>
          ) : (
            serviciosFiltrados.map((s) => (
              <div key={s.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-black">{s.nombre}</p>
                    <p className="mt-1 text-xs text-neutral-500">{s.descripcion ?? "—"}</p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${pillActivo(
                      s.activo,
                    )}`}
                  >
                    {s.activo ? "ACTIVO" : "INACTIVO"}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => abrirEditar(s)}
                    disabled={accionId === s.id}
                    className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => pedirToggle(s)}
                    disabled={accionId === s.id}
                    className={[
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                      s.activo
                        ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
                        : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50",
                    ].join(" ")}
                  >
                    {s.activo ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Modal crear/editar */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={cerrarModal} />

          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-black">
                  {editId ? "Editar servicio" : "Crear servicio"}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Completa los datos y guarda los cambios.
                </p>
              </div>

              <button
                onClick={cerrarModal}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-sm text-black hover:bg-neutral-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  onBlur={() => setTouched({ nombre: true })}
                  placeholder="Ej: Corte clásico"
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none ${
                    nombreError ? "border-red-400" : "border-neutral-300 focus:border-black"
                  }`}
                />
                {nombreError ? <p className="text-xs text-red-600">{nombreError}</p> : null}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Opcional"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={cerrarModal}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-black hover:bg-neutral-50"
              >
                Cancelar
              </button>

              <button
                onClick={() => void guardar()}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                disabled={!canSave || accionId === (editId ?? "create")}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.nextActivo ? "Activar servicio" : "Desactivar servicio"}
        message={
          toggleTarget
            ? toggleTarget.nextActivo
              ? `¿Seguro que quieres activar el servicio "${toggleTarget.nombre}"?`
              : `¿Seguro que quieres desactivar el servicio "${toggleTarget.nombre}"?`
            : ""
        }
        confirmText={
          accionId === toggleTarget?.id
            ? toggleTarget?.nextActivo
              ? "Activando..."
              : "Desactivando..."
            : toggleTarget?.nextActivo
              ? "Sí, activar"
              : "Sí, desactivar"
        }
        cancelText="Volver"
        variant={toggleTarget?.nextActivo ? "default" : "danger"}
        onConfirm={() => void confirmarToggle()}
        onClose={cancelarToggle}
      />

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
    </section>
  );
}
