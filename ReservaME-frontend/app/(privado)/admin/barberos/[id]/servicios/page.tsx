"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAdminBarberoServicios } from "@/lib/useAdminBarberoServicios";
import {
  activarServicioDeBarberoAdmin,
  asignarServicioABarberoAdmin,
  desactivarServicioDeBarberoAdmin,
  listarServiciosAdmin,
  type AdminServicioItem,
  type AdminBarberoServicioItem,
} from "@/services/admin-barbero-servicios.service";

import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

function isValidMoney(v: string) {
  const limpio = v.trim();

  if (!limpio) return false;
  if (limpio.includes(",")) return false;

  const n = Number(limpio);

  return Number.isFinite(n) && n >= 0;
}

function isValidDuration(v: string) {
  if (!v.trim()) return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && Number.isInteger(n);
}

function pillActivo(activo: boolean) {
  return activo
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
    : "bg-neutral-500/10 text-neutral-700 border-neutral-500/30";
}

type ToggleBarberoServicioTarget = {
  id: string;
  name: string;
  nextActive: boolean;
};

export default function AdminBarberoServiciosPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const barberId = params?.id;

  const { data, loading, error, refetch } = useAdminBarberoServicios(barberId);
  const asignados: AdminBarberoServicioItem[] = (data ?? []) as any;

  const [catalogo, setCatalogo] = useState<AdminServicioItem[]>([]);
  const [catalogoLoading, setCatalogoLoading] = useState(false);

  const [q, setQ] = useState("");

  // Modal asignar
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [formAsignar, setFormAsignar] = useState({
    serviceId: "",
    price: "0",
    durationMin: "0",
  });
  const [touchedAsignar, setTouchedAsignar] = useState({
    serviceId: false,
    price: false,
    durationMin: false,
  });

  // Modal editar
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminBarberoServicioItem | null>(null);
  const [formEditar, setFormEditar] = useState({
    price: "",
    durationMin: "",
  });
  const [touchedEditar, setTouchedEditar] = useState({
    price: false,
    durationMin: false,
  });

  const [asignarConfirmOpen, setAsignarConfirmOpen] = useState(false);
  const [editarConfirmOpen, setEditarConfirmOpen] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<ToggleBarberoServicioTarget | null>(null);

  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    title: "",
    message: "",
    variant: "success" as "success" | "error",
  });

  // Busy global
  const [accionId, setAccionId] = useState<string | null>(null);

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

  // Carga catálogo de servicios (para asignar)
  useEffect(() => {
    async function loadCatalogo() {
      setCatalogoLoading(true);
      try {
        const res = await listarServiciosAdmin();
        setCatalogo(res ?? []);
      } catch (e: any) {
        // El catálogo no es crítico para ver asignados, por eso solo se muestra mensaje suave
        setCatalogo([]);
      } finally {
        setCatalogoLoading(false);
      }
    }
    void loadCatalogo();
  }, []);

  const asignadosFiltrados = useMemo(() => {
    const query = q.trim().toLowerCase();
    return asignados
      .filter((x) => {
        if (!query) return true;
        const name = x.service?.name ?? "";
        const text = `${name}`.toLowerCase();
        return text.includes(query);
      })
      .sort((a, b) => (a.service?.name ?? "").localeCompare(b.service?.name ?? ""));
  }, [asignados, q]);

  // Servicios disponibles para asignar (evita duplicados por unique(barberId, serviceId))
  const serviciosDisponibles = useMemo(() => {
    const usados = new Set(asignados.map((a) => a.serviceId));
    return catalogo.filter((s) => !usados.has(s.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [catalogo, asignados]);

  // ===== Validaciones asignar =====
  const asignarServiceIdError = useMemo(() => {
    if (!touchedAsignar.serviceId) return "";
    if (!formAsignar.serviceId) return "Debes seleccionar un servicio.";
    return "";
  }, [formAsignar.serviceId, touchedAsignar.serviceId]);

  const asignarPriceError = useMemo(() => {
    if (!touchedAsignar.price) return "";
    if (!isValidMoney(formAsignar.price)) return "Precio inválido (>= 0).";
    return "";
  }, [formAsignar.price, touchedAsignar.price]);

  const asignarDurationError = useMemo(() => {
    if (!touchedAsignar.durationMin) return "";
    if (!isValidDuration(formAsignar.durationMin))
      return "Duración inválida (minutos, entero >= 0).";
    return "";
  }, [formAsignar.durationMin, touchedAsignar.durationMin]);

  const canAsignar = !asignarServiceIdError && !asignarPriceError && !asignarDurationError;

  // ===== Validaciones editar =====
  const editarPriceError = useMemo(() => {
    if (!touchedEditar.price) return "";
    if (!isValidMoney(formEditar.price)) return "Precio inválido (>= 0).";
    return "";
  }, [formEditar.price, touchedEditar.price]);

  const editarDurationError = useMemo(() => {
    if (!touchedEditar.durationMin) return "";
    if (!isValidDuration(formEditar.durationMin))
      return "Duración inválida (minutos, entero >= 0).";
    return "";
  }, [formEditar.durationMin, touchedEditar.durationMin]);

  const canEditar = !editarPriceError && !editarDurationError;

  // ===== Acciones UI =====
  function abrirAsignar() {
    setFormAsignar({ serviceId: "", price: "0", durationMin: "0" });
    setTouchedAsignar({ serviceId: false, price: false, durationMin: false });
    setAsignarConfirmOpen(false);
    setModalAsignarOpen(true);
  }

  function cerrarAsignar() {
    if (accionId) return;
    setAsignarConfirmOpen(false);
    setModalAsignarOpen(false);
  }

  function pedirAsignar() {
    setTouchedAsignar({ serviceId: true, price: true, durationMin: true });

    if (!barberId) {
      mostrarFeedback({
        title: "No se pudo asignar",
        message: "Falta el id del barbero en la ruta.",
        variant: "error",
      });
      return;
    }

    if (
      !formAsignar.serviceId ||
      !isValidMoney(formAsignar.price) ||
      !isValidDuration(formAsignar.durationMin)
    ) {
      mostrarFeedback({
        title: "Campos inválidos",
        message: "Revisa los campos marcados antes de asignar el servicio.",
        variant: "error",
      });
      return;
    }

    setAsignarConfirmOpen(true);
  }

  async function confirmarAsignar() {
    setTouchedAsignar({ serviceId: true, price: true, durationMin: true });

    if (!barberId) {
      setAsignarConfirmOpen(false);

      mostrarFeedback({
        title: "No se pudo asignar",
        message: "Falta el id del barbero en la ruta.",
        variant: "error",
      });
      return;
    }

    if (
      !formAsignar.serviceId ||
      !isValidMoney(formAsignar.price) ||
      !isValidDuration(formAsignar.durationMin)
    ) {
      setAsignarConfirmOpen(false);

      mostrarFeedback({
        title: "Campos inválidos",
        message: "Revisa los campos marcados antes de asignar el servicio.",
        variant: "error",
      });
      return;
    }

    try {
      setAccionId("__assign__");

      await asignarServicioABabarberoSafe(barberId, {
        serviceId: formAsignar.serviceId,
        price: Number(formAsignar.price),
        durationMin: Number(formAsignar.durationMin),
      });

      setAsignarConfirmOpen(false);
      setModalAsignarOpen(false);

      mostrarFeedback({
        title: "Servicio asignado",
        message: "El servicio fue asignado correctamente al barbero.",
        variant: "success",
      });

      await refetch();
    } catch (e: any) {
      setAsignarConfirmOpen(false);

      mostrarFeedback({
        title: "No se pudo asignar",
        message: e?.message ? String(e.message) : "No se pudo asignar el servicio.",
        variant: "error",
      });
    } finally {
      setAccionId(null);
    }
  }

  // Esta función evita fallas si el backend espera “durationMin” u otro nombre
  async function asignarServicioABabarberoSafe(
    idBarbero: string,
    dto: { serviceId: string; price: number; durationMin: number },
  ) {
    return asignarServicioABarberoAdmin(idBarbero, dto);
  }

  // function abrirEditar(item: AdminBarberoServicioItem) {
  //   setEditItem(item);

  //   const priceVal = item.price ?? "0";
  //   const durVal = String(item.durationMin ?? 0);

  //   setFormEditar({ price: priceVal, durationMin: durVal });
  //   setTouchedEditar({ price: false, durationMin: false });
  //   setEditarConfirmOpen(false);
  //   setModalEditarOpen(true);
  // }

  // function cerrarEditar() {
  //   if (accionId) return;
  //   setEditarConfirmOpen(false);
  //   setModalEditarOpen(false);
  //   setEditItem(null);
  // }

  // function pedirEditar() {
  //   setTouchedEditar({ price: true, durationMin: true });

  //   if (!barberId || !editItem) {
  //     mostrarFeedback({
  //       title: "No se pudo editar",
  //       message: "Faltan datos para editar este servicio.",
  //       variant: "error",
  //     });
  //     return;
  //   }

  //   if (!isValidMoney(formEditar.price) || !isValidDuration(formEditar.durationMin)) {
  //     mostrarFeedback({
  //       title: "Campos inválidos",
  //       message: "Revisa el precio y la duración antes de guardar.",
  //       variant: "error",
  //     });
  //     return;
  //   }

  //   setEditarConfirmOpen(true);
  // }

  // async function confirmarEditar() {
  //   setTouchedEditar({ price: true, durationMin: true });

  //   if (!barberId || !editItem) {
  //     setEditarConfirmOpen(false);
  //     return;
  //   }

  //   const priceNumber = Number(formEditar.price);
  //   const durationNumber = Number(formEditar.durationMin);

  //   if (
  //     !Number.isFinite(priceNumber) ||
  //     priceNumber < 0 ||
  //     !Number.isFinite(durationNumber) ||
  //     durationNumber < 0 ||
  //     !Number.isInteger(durationNumber)
  //   ) {
  //     setEditarConfirmOpen(false);

  //     mostrarFeedback({
  //       title: "Campos inválidos",
  //       message: "Revisa el precio y la duración antes de guardar.",
  //       variant: "error",
  //     });

  //     return;
  //   }

  //   try {
  //     setAccionId(editItem.id);

  //     await actualizarServicioDeBarberoAdmin(barberId, editItem.id, {
  //       price: priceNumber,
  //       durationMin: durationNumber,
  //     });

  //     setEditarConfirmOpen(false);
  //     setModalEditarOpen(false);
  //     setEditItem(null);

  //     mostrarFeedback({
  //       title: "Servicio actualizado",
  //       message: "El precio y la duración fueron actualizados correctamente.",
  //       variant: "success",
  //     });

  //     await refetch();
  //   } catch (e: any) {
  //     setEditarConfirmOpen(false);

  //     mostrarFeedback({
  //       title: "No se pudo actualizar",
  //       message: e?.message ? String(e.message) : "No se pudo actualizar.",
  //       variant: "error",
  //     });
  //   } finally {
  //     setAccionId(null);
  //   }
  // }

  function pedirToggle(item: AdminBarberoServicioItem) {
    setToggleTarget({
      id: item.id,
      name: item.service?.name ?? "(servicio)",
      nextActive: !item.isActive,
    });
  }

  function cancelarToggle() {
    if (accionId === toggleTarget?.id) return;
    setToggleTarget(null);
  }

  async function confirmarToggle() {
    if (!barberId || !toggleTarget) return;

    try {
      setAccionId(toggleTarget.id);

      if (toggleTarget.nextActive) {
        await activarServicioDeBarberoAdmin(barberId, toggleTarget.id);
      } else {
        await desactivarServicioDeBarberoAdmin(barberId, toggleTarget.id);
      }

      setToggleTarget(null);

      mostrarFeedback({
        title: toggleTarget.nextActive ? "Servicio activado" : "Servicio desactivado",
        message: toggleTarget.nextActive
          ? "El servicio volverá a estar disponible para este barbero."
          : "El servicio ya no estará disponible para este barbero.",
        variant: "success",
      });

      await refetch();
    } catch (e: any) {
      mostrarFeedback({
        title: "No se pudo actualizar",
        message: e?.message ? String(e.message) : "No se pudo actualizar el estado.",
        variant: "error",
      });
    } finally {
      setAccionId(null);
    }
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            onClick={() => router.push("/admin/barberos")}
            className="text-sm text-neutral-600 hover:text-black"
          >
            ← Volver a Barberos
          </button>

          <h1 className="mt-2 text-2xl font-semibold text-black">Servicios del barbero</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Asigna servicios y define precio/duración por barbero.
          </p>
        </div>

        <button
          onClick={abrirAsignar}
          disabled={Boolean(accionId) || catalogoLoading}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          + Asignar servicio
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          Cargando servicios asignados...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Filtros */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-neutral-600">Buscar</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre del servicio..."
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none placeholder:text-neutral-400 focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">Disponibles</label>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              {serviciosDisponibles.length} para asignar
            </div>
          </div>
        </div>
      </div>

      {/* Estados */}
      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          Cargando servicios asignados...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Tabla Desktop */}
      {!loading && !error ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-600">
                <tr>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Duración</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {asignadosFiltrados.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-500" colSpan={5}>
                      No hay servicios asignados con esos filtros.
                    </td>
                  </tr>
                ) : (
                  asignadosFiltrados.map((x) => {
                    const rowBusy = accionId === x.id;
                    const nombre = x.service?.name ?? "(servicio)";
                    const precio = Number(x.price);

                    return (
                      <tr key={x.id} className="border-t border-neutral-100">
                        <td className="px-4 py-3">
                          <div className="font-medium text-black">{nombre}</div>
                        </td>

                        <td className="px-4 py-3 text-neutral-800">
                          ${Number.isFinite(precio) ? precio.toLocaleString("es-CL") : "—"}
                        </td>

                        <td className="px-4 py-3 text-neutral-800">{x.durationMin} min</td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${pillActivo(
                              x.isActive,
                            )}`}
                          >
                            {x.isActive ? "ACTIVO" : "INACTIVO"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">

                            <button
                              onClick={() => pedirToggle(x)}
                              disabled={Boolean(accionId)}
                              className={[
                                "rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                                x.isActive
                                  ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
                                  : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50",
                              ].join(" ")}
                            >
                              {rowBusy ? "Procesando..." : x.isActive ? "Desactivar" : "Activar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {asignadosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                No hay servicios asignados con esos filtros.
              </div>
            ) : (
              asignadosFiltrados.map((x) => {
                const rowBusy = accionId === x.id;
                const nombre = x.service?.name ?? "(servicio)";
                const precio = Number(x.price);

                return (
                  <div key={x.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-black">{nombre}</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {x.durationMin} min • $
                          {Number.isFinite(precio) ? precio.toLocaleString("es-CL") : "—"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${pillActivo(
                          x.isActive,
                        )}`}
                      >
                        {x.isActive ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">

                      <button
                        onClick={() => pedirToggle(x)}
                        disabled={Boolean(accionId)}
                        className={[
                          "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                          x.isActive
                            ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
                            : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50",
                        ].join(" ")}
                      >
                        {rowBusy ? "Procesando..." : x.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : null}

      {/* Modal Asignar */}
      {modalAsignarOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={cerrarAsignar} />

          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-black">Asignar servicio</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Selecciona un servicio y define el precio/duración inicial (puede ser 0).
                </p>
              </div>

              <button
                onClick={cerrarAsignar}
                disabled={Boolean(accionId)}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Servicio *</label>
                <select
                  value={formAsignar.serviceId}
                  onChange={(e) => setFormAsignar((p) => ({ ...p, serviceId: e.target.value }))}
                  onBlur={() => setTouchedAsignar((p) => ({ ...p, serviceId: true }))}
                  disabled={Boolean(accionId)}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none ${
                    asignarServiceIdError
                      ? "border-red-400"
                      : "border-neutral-300 focus:border-black"
                  }`}
                >
                  <option value="">-- Selecciona --</option>
                  {serviciosDisponibles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isActive ? "" : "(inactivo)"}
                    </option>
                  ))}
                </select>
                {asignarServiceIdError ? (
                  <p className="text-xs text-red-600">{asignarServiceIdError}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600">Precio *</label>
                  <input
                    value={formAsignar.price}
                    onChange={(e) => setFormAsignar((p) => ({ ...p, price: e.target.value }))}
                    onBlur={() => setTouchedAsignar((p) => ({ ...p, price: true }))}
                    disabled={Boolean(accionId)}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none ${
                      asignarPriceError ? "border-red-400" : "border-neutral-300 focus:border-black"
                    }`}
                    placeholder="0"
                    inputMode="numeric"
                  />
                  {asignarPriceError ? (
                    <p className="text-xs text-red-600">{asignarPriceError}</p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600">Duración (min) *</label>
                  <input
                    value={formAsignar.durationMin}
                    onChange={(e) => setFormAsignar((p) => ({ ...p, durationMin: e.target.value }))}
                    onBlur={() => setTouchedAsignar((p) => ({ ...p, durationMin: true }))}
                    disabled={Boolean(accionId)}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none ${
                      asignarDurationError
                        ? "border-red-400"
                        : "border-neutral-300 focus:border-black"
                    }`}
                    placeholder="0"
                    inputMode="numeric"
                  />
                  {asignarDurationError ? (
                    <p className="text-xs text-red-600">{asignarDurationError}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={cerrarAsignar}
                disabled={Boolean(accionId)}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={pedirAsignar}
                disabled={!canAsignar || Boolean(accionId)}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {accionId ? "Guardando..." : "Asignar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Editar
      {modalEditarOpen && editItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={cerrarEditar} />

          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-black">Editar servicio</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Ajusta el precio y duración para este barbero.
                </p>
              </div>

              <button
                onClick={cerrarEditar}
                disabled={Boolean(accionId)}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                {editItem.service?.name ?? "(servicio)"}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600">Precio *</label>
                  <input
                    value={formEditar.price}
                    onChange={(e) => setFormEditar((p) => ({ ...p, price: e.target.value }))}
                    onBlur={() => setTouchedEditar((p) => ({ ...p, price: true }))}
                    disabled={Boolean(accionId)}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none ${
                      editarPriceError ? "border-red-400" : "border-neutral-300 focus:border-black"
                    }`}
                    inputMode="numeric"
                  />
                  {editarPriceError ? (
                    <p className="text-xs text-red-600">{editarPriceError}</p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600">Duración (min) *</label>
                  <input
                    value={formEditar.durationMin}
                    onChange={(e) => setFormEditar((p) => ({ ...p, durationMin: e.target.value }))}
                    onBlur={() => setTouchedEditar((p) => ({ ...p, durationMin: true }))}
                    disabled={Boolean(accionId)}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none ${
                      editarDurationError
                        ? "border-red-400"
                        : "border-neutral-300 focus:border-black"
                    }`}
                    inputMode="numeric"
                  />
                  {editarDurationError ? (
                    <p className="text-xs text-red-600">{editarDurationError}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={cerrarEditar}
                disabled={Boolean(accionId)}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={pedirEditar}
                disabled={!canEditar || Boolean(accionId)}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {accionId ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null} */}

      <ConfirmDialog
        open={asignarConfirmOpen}
        title="Asignar servicio"
        message="¿Seguro que quieres asignar este servicio al barbero?"
        confirmText={accionId === "__assign__" ? "Asignando..." : "Sí, asignar"}
        cancelText="Volver"
        variant="default"
        onConfirm={() => void confirmarAsignar()}
        onClose={() => {
          if (accionId === "__assign__") return;
          setAsignarConfirmOpen(false);
        }}
      />

      {/* <ConfirmDialog
        open={editarConfirmOpen}
        title="Guardar cambios"
        message={
          editItem
            ? `¿Seguro que quieres guardar los cambios del servicio "${
                editItem.service?.name ?? "(servicio)"
              }"?`
            : ""
        }
        confirmText={accionId === editItem?.id ? "Guardando..." : "Sí, guardar"}
        cancelText="Volver"
        variant="default"
        onConfirm={() => void confirmarEditar()}
        onClose={() => {
          if (accionId === editItem?.id) return;
          setEditarConfirmOpen(false);
        }}
      /> */}

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.nextActive ? "Activar servicio" : "Desactivar servicio"}
        message={
          toggleTarget
            ? toggleTarget.nextActive
              ? `¿Seguro que quieres activar el servicio "${toggleTarget.name}" para este barbero?`
              : `¿Seguro que quieres desactivar el servicio "${toggleTarget.name}" para este barbero?`
            : ""
        }
        confirmText={
          accionId === toggleTarget?.id
            ? toggleTarget?.nextActive
              ? "Activando..."
              : "Desactivando..."
            : toggleTarget?.nextActive
              ? "Sí, activar"
              : "Sí, desactivar"
        }
        cancelText="Volver"
        variant={toggleTarget?.nextActive ? "default" : "danger"}
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
