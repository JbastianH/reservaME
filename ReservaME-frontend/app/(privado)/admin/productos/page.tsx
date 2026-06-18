"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ApiError } from "@/lib/api";
import {
  actualizarProductoAdmin,
  crearProductoAdmin,
  eliminarProductoAdmin,
  listarProductosAdmin,
} from "@/services/productos.service";
import Image from "next/image";
import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

// Se importa la utilidad de Cloudinary para la carga de archivos
import { subirImagenCloudinary } from "@/lib/cloudinaryUpload";

type ProductoItem = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  imagenUrl?: string;
  activo: boolean;
  createdAt?: string;
};

type FormState = {
  nombre: string;
  descripcion: string;
  precio: number | "";
  stock: number | "";
  imagenUrl: string;
};
type DeleteProductoTarget = {
  id: string;
  nombre: string;
};
export default function AdminProductosPage() {
  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accionId, setAccionId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"TODOS" | "ACTIVOS" | "INACTIVOS">("TODOS");

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    imagenUrl: "",
  });
  const [touched, setTouched] = useState<{ nombre: boolean; precio: boolean; stock: boolean }>({
    nombre: false,
    precio: false,
    stock: false,
  });

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadError, setLoadError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<DeleteProductoTarget | null>(null);

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

  async function refetchProductos() {
    setLoading(true);
    setLoadError("");

    try {
      const res = await listarProductosAdmin();

      const mapped: ProductoItem[] = res.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion ?? undefined,
        precio: p.precio,
        stock: p.stock,
        imagenUrl: p.imagenUrl ?? undefined,
        activo: p.activo ?? true,
        createdAt: p.createdAt,
      }));

      setProductos(mapped);
    } catch (err) {
      setLoadError(mapearError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refetchProductos();
  }, []);

  // Lógica de actualización rápida de Stock
  const handleUpdateStock = async (id: string, nuevoStock: number) => {
    if (nuevoStock < 0) return;

    setAccionId(id);

    try {
      await actualizarProductoAdmin(id, { stock: nuevoStock });

      setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, stock: nuevoStock } : p)));

      mostrarFeedback({
        title: "Stock actualizado",
        message: "El inventario del producto fue actualizado correctamente.",
        variant: "success",
      });
    } catch {
      mostrarFeedback({
        title: "No se pudo actualizar",
        message: "No se pudo actualizar el inventario.",
        variant: "error",
      });
    } finally {
      setAccionId(null);
    }
  };

  const nombreError = useMemo(() => {
    if (!touched.nombre) return "";
    const v = form.nombre.trim();
    if (!v) return "El nombre es obligatorio.";
    if (v.length < 3) return "El nombre debe tener al menos 3 caracteres.";
    return "";
  }, [form.nombre, touched.nombre]);

  const precioError = useMemo(() => {
    if (!touched.precio) return "";
    if (form.precio === "" || Number(form.precio) < 0) return "Ingresa un precio válido.";
    return "";
  }, [form.precio, touched.precio]);

  const stockError = useMemo(() => {
    if (!touched.stock) return "";
    if (form.stock === "" || Number(form.stock) < 0) return "Ingresa un stock válido.";
    return "";
  }, [form.stock, touched.stock]);

  const canSave =
    !nombreError &&
    !precioError &&
    !stockError &&
    form.nombre.trim().length > 0 &&
    form.precio !== "" &&
    form.stock !== "";

  const productosFiltrados = useMemo(() => {
    const query = q.trim().toLowerCase();

    return productos
      .filter((p) => {
        if (estado === "ACTIVOS" && !p.activo) return false;
        if (estado === "INACTIVOS" && p.activo) return false;

        if (query) {
          const text = `${p.nombre} ${p.descripcion ?? ""}`.toLowerCase();
          if (!text.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos, q, estado]);

  const formatearCLP = (valor: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(valor);
  };

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
    setForm({ nombre: "", descripcion: "", precio: "", stock: "", imagenUrl: "" });
    setTouched({ nombre: false, precio: false, stock: false });
    setUploadingFoto(false);
    setModalOpen(true);
  }

  function abrirEditar(item: ProductoItem) {
    setEditId(item.id);
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion ?? "",
      precio: item.precio,
      stock: item.stock,
      imagenUrl: item.imagenUrl ?? "",
    });
    setTouched({ nombre: false, precio: false, stock: false });
    setUploadingFoto(false);
    setModalOpen(true);
  }

  function cerrarModal() {
    setModalOpen(false);
    setEditId(null);
    setTouched({ nombre: false, precio: false, stock: false });
  }

  async function onSubirFoto(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      mostrarFeedback({
        title: "Imagen muy pesada",
        message: "La imagen supera el peso máximo permitido de 10MB.",
        variant: "error",
      });
      return;
    }

    try {
      setUploadingFoto(true);

      const up = await subirImagenCloudinary({
        file,
        variant: "productos",
        folder: "bawstudio/productos",
      });

      setForm((p) => ({ ...p, imagenUrl: up.secureUrl }));

      mostrarFeedback({
        title: "Imagen cargada",
        message: "La imagen fue subida correctamente. Guarda el producto para aplicar el cambio.",
        variant: "success",
      });
    } catch (e: any) {
      mostrarFeedback({
        title: "No se pudo subir la foto",
        message: e?.message ? String(e.message) : "No se pudo subir la foto.",
        variant: "error",
      });
    } finally {
      setUploadingFoto(false);
    }
  }

  async function guardar() {
    setTouched({ nombre: true, precio: true, stock: true });

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
    const payloadUrl = form.imagenUrl.trim();

    const existe = productos.some(
      (p) =>
        p.nombre.toLowerCase() === payloadNombre.toLowerCase() && (editId ? p.id !== editId : true),
    );

    if (existe) {
      mostrarFeedback({
        title: "Producto duplicado",
        message: "Ya existe un producto con ese nombre.",
        variant: "error",
      });
      return;
    }

    try {
      setAccionId(editId ?? "create");

      const datosProducto = {
        nombre: payloadNombre,
        descripcion: payloadDesc ? payloadDesc : null,
        precio: Number(form.precio),
        stock: Number(form.stock),
        imagenUrl: payloadUrl ? payloadUrl : null,
      };

      if (!editId) {
        await crearProductoAdmin({ ...datosProducto, activo: true });

        setModalOpen(false);

        mostrarFeedback({
          title: "Producto creado",
          message: "El producto fue registrado correctamente.",
          variant: "success",
        });

        await refetchProductos();
        return;
      }

      await actualizarProductoAdmin(editId, datosProducto);

      setModalOpen(false);

      mostrarFeedback({
        title: "Producto actualizado",
        message: "Los cambios del producto fueron guardados correctamente.",
        variant: "success",
      });

      await refetchProductos();
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

  function pedirEliminar(item: ProductoItem) {
    setDeleteTarget({
      id: item.id,
      nombre: item.nombre,
    });
  }

  function cancelarEliminar() {
    if (accionId === deleteTarget?.id) return;
    setDeleteTarget(null);
  }

  async function confirmarEliminar() {
    if (!deleteTarget?.id) return;

    try {
      setAccionId(deleteTarget.id);

      await eliminarProductoAdmin(deleteTarget.id);

      setDeleteTarget(null);

      mostrarFeedback({
        title: "Producto eliminado",
        message: "El producto fue eliminado de forma permanente.",
        variant: "success",
      });

      await refetchProductos();
    } catch (err) {
      mostrarFeedback({
        title: "No se pudo eliminar",
        message: mapearError(err),
        variant: "error",
      });
    } finally {
      setAccionId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Inventario</h1>
          <p className="mt-1 text-sm text-neutral-600">Administra los productos de tu barbería.</p>
        </div>

        <button
          onClick={abrirCrear}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          + Crear producto
        </button>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          Cargando inventario...
        </div>
      )}

      {/* Filtros */}
      {!loading && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-neutral-600">Buscar</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre del producto..."
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
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
      )}

      {/* Desktop: tabla */}
      {!loading && (
        <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-600">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-500" colSpan={4}>
                    No hay productos con esos filtros.
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-t border-neutral-100 transition-opacity hover:bg-neutral-50/50 ${accionId === p.id ? "opacity-50" : "opacity-100"}`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4">
                        {/* Imagen más grande */}
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm">
                          {p.imagenUrl ? (
                            <Image
                              src={p.imagenUrl}
                              alt={p.nombre}
                              fill
                              className="object-cover transition-transform hover:scale-110"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center text-[10px] text-neutral-400">
                              Sin img
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-base font-bold text-black">{p.nombre}</div>
                          <div className="line-clamp-2 max-w-[200px] text-xs text-neutral-500">
                            {p.descripcion ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-black">{formatearCLP(p.precio)}</td>

                    <td className="px-4 py-3">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-2 py-1.5 text-xs font-bold transition-all ${p.stock > 0 ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}
                      >
                        <button
                          onClick={() => handleUpdateStock(p.id, p.stock - 1)}
                          disabled={p.stock <= 0 || accionId !== null}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 active:scale-90 disabled:opacity-30"
                        >
                          -
                        </button>

                        <span className="min-w-[4ch] text-center">● {p.stock} unid.</span>

                        <button
                          onClick={() => handleUpdateStock(p.id, p.stock + 1)}
                          disabled={accionId !== null}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 active:scale-90"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => abrirEditar(p)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-neutral-50"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => pedirEliminar(p)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:border-red-300 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile: cards */}
      {!loading && (
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {productosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
              No hay productos con esos filtros.
            </div>
          ) : (
            productosFiltrados.map((p) => (
              <div key={p.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm">
                    {p.imagenUrl ? (
                      <Image src={p.imagenUrl} alt={p.nombre} fill className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[10px] font-medium text-neutral-400">
                        Sin img
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-black">{p.nombre}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm font-semibold text-black">{formatearCLP(p.precio)}</p>
                      {/* Stock móvil con botones integrados */}
                      <div
                        className={`flex items-center gap-2 rounded-full border px-2 py-1 text-[10px] font-bold ${p.stock > 0 ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}
                      >
                        <button
                          onClick={() => handleUpdateStock(p.id, p.stock - 1)}
                          className="h-5 w-5 rounded-full border bg-white"
                        >
                          -
                        </button>
                        <span>{p.stock}</span>
                        <button
                          onClick={() => handleUpdateStock(p.id, p.stock + 1)}
                          className="h-5 w-5 rounded-full border bg-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => abrirEditar(p)}
                    className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-bold text-black hover:bg-neutral-50"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => pedirEliminar(p)}
                    className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarModal} />

          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-black">
                  {editId ? "Editar producto" : "Registrar producto"}
                </h2>
                <p className="mt-1 text-sm font-medium text-neutral-600">
                  Ingresa la información detallada para la tienda.
                </p>
              </div>

              <button
                onClick={cerrarModal}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-sm font-bold text-black hover:bg-neutral-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
                  Nombre del producto *
                </label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  onBlur={() => setTouched((p) => ({ ...p, nombre: true }))}
                  placeholder="Ej: Cera Mate Premium"
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-black transition-all outline-none ${
                    nombreError ? "border-red-400" : "border-neutral-200 focus:border-black"
                  }`}
                />
                {nombreError && <p className="text-xs font-medium text-red-600">{nombreError}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
                  Precio (CLP) *
                </label>
                <input
                  type="number"
                  value={form.precio}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, precio: e.target.value ? Number(e.target.value) : "" }))
                  }
                  onBlur={() => setTouched((p) => ({ ...p, precio: true }))}
                  placeholder="Ej: 15000"
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-black outline-none ${
                    precioError ? "border-red-400" : "border-neutral-200 focus:border-black"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
                  Stock Inicial *
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, stock: e.target.value ? Number(e.target.value) : "" }))
                  }
                  onBlur={() => setTouched((p) => ({ ...p, stock: true }))}
                  placeholder="Ej: 10"
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-black outline-none ${
                    stockError ? "border-red-400" : "border-neutral-200 focus:border-black"
                  }`}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
                  Foto del producto (subir)
                </label>
                <div className="mt-2 flex items-center gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                  {form.imagenUrl && (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
                      <Image src={form.imagenUrl} alt="Preview" fill className="object-cover" />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      disabled={accionId !== null || uploadingFoto}
                      className="block w-full text-xs text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-neutral-800 disabled:opacity-50"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await onSubirFoto(file);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[10px] font-medium tracking-tight text-neutral-500">
                        JPG/PNG. Máx 10MB.
                      </p>
                      {uploadingFoto && (
                        <p className="animate-pulse text-[10px] font-bold text-blue-600">
                          SUBIENDO...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
                  Descripción
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Detalles técnicos o modo de uso (Opcional)"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={cerrarModal}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-neutral-50"
              >
                Cancelar
              </button>

              <button
                onClick={() => void guardar()}
                className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-neutral-800 active:scale-95 disabled:opacity-50"
                disabled={!canSave || uploadingFoto || accionId === (editId ?? "create")}
              >
                {accionId === (editId ?? "create") ? "Guardando..." : "Confirmar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar producto"
        message={
          deleteTarget
            ? `Esta acción no se puede deshacer. ¿Seguro que quieres eliminar el producto "${deleteTarget.nombre}"?`
            : ""
        }
        confirmText={accionId === deleteTarget?.id ? "Eliminando..." : "Sí, eliminar"}
        cancelText="Volver"
        variant="danger"
        onConfirm={() => void confirmarEliminar()}
        onClose={cancelarEliminar}
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
