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

  const [confirm, setConfirm] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });

  const [bannerOk, setBannerOk] = useState("");
  const [bannerError, setBannerError] = useState("");

  function mapearError(err: unknown): string {
    const e = err as Partial<ApiError> | undefined;
    if (e?.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
    if (e?.status === 403) return "No autorizado.";
    return e?.message ?? "Ocurrió un error.";
  }

  async function refetchProductos() {
    setLoading(true);
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
      setBannerError(mapearError(err));
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
      
      // Actualizamos el estado local inmediatamente
      setProductos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: nuevoStock } : p))
      );
    } catch (err) {
      setBannerError("No se pudo actualizar el inventario.");
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

  function resetBanners() {
    setBannerOk("");
    setBannerError("");
  }

  function abrirCrear() {
    resetBanners();
    setEditId(null);
    setForm({ nombre: "", descripcion: "", precio: "", stock: "", imagenUrl: "" });
    setTouched({ nombre: false, precio: false, stock: false });
    setUploadingFoto(false);
    setModalOpen(true);
  }

  function abrirEditar(item: ProductoItem) {
    resetBanners();
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
    resetBanners();
    if (file.size > 10 * 1024 * 1024) {
      setBannerError("La imagen es muy pesada (máx 10MB).");
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
    } catch (e: any) {
      setBannerError(e?.message ? String(e.message) : "No se pudo subir la foto.");
    } finally {
      setUploadingFoto(false);
    }
  }

  async function guardar() {
    resetBanners();
    setTouched({ nombre: true, precio: true, stock: true });

    if (!canSave) {
      setBannerError("Revisa los campos marcados.");
      return;
    }

    const payloadNombre = form.nombre.trim();
    const payloadDesc = form.descripcion.trim();
    const payloadUrl = form.imagenUrl.trim();

    const existe = productos.some(
      (p) =>
        p.nombre.toLowerCase() === payloadNombre.toLowerCase() &&
        (editId ? p.id !== editId : true),
    );
    if (existe) {
      setBannerError("Ya existe un producto con ese nombre.");
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
        setBannerOk("Producto creado ✔︎");
      } else {
        await actualizarProductoAdmin(editId, datosProducto);
        setBannerOk("Producto actualizado ✔︎");
      }

      setModalOpen(false);
      await refetchProductos();
    } catch (err) {
      setBannerError(mapearError(err));
    } finally {
      setAccionId(null);
    }
  }

  function pedirEliminar(item: ProductoItem) {
    resetBanners();
    setConfirm({ open: true, id: item.id });
  }

  async function confirmarEliminar() {
    if (!confirm.id) return;

    try {
      setAccionId(confirm.id);
      await eliminarProductoAdmin(confirm.id);

      setBannerOk("Producto eliminado de forma permanente ✔︎");
      setConfirm({ open: false, id: null });
      await refetchProductos();
    } catch (err) {
      setBannerError(mapearError(err));
    } finally {
      setAccionId(null);
    }
  }

  function cancelarEliminar() {
    setConfirm({ open: false, id: null });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Inventario</h1>
          <p className="mt-1 text-sm text-neutral-600">Administra los productos de Black & White Studio.</p>
        </div>

        <button
          onClick={abrirCrear}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          + Crear producto
        </button>
      </div>

      {/* Banners */}
      {bannerOk && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          {bannerOk}
        </div>
      )}

      {bannerError && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {bannerError}
        </div>
      )}

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
                  <tr key={p.id} className={`border-t border-neutral-100 hover:bg-neutral-50/50 transition-opacity ${accionId === p.id ? 'opacity-50' : 'opacity-100'}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4">
                        {/* Imagen más grande */}
                        <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 flex-shrink-0 shadow-sm">
                          {p.imagenUrl ? (
                            <Image src={p.imagenUrl} alt={p.nombre} fill className="object-cover transition-transform hover:scale-110" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-[10px] text-neutral-400">Sin img</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-black text-base">{p.nombre}</div>
                          <div className="text-xs text-neutral-500 line-clamp-2 max-w-[200px]">{p.descripcion ?? "—"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-black">
                      {formatearCLP(p.precio)}
                    </td>

                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-2 rounded-full border px-2 py-1.5 text-xs font-bold transition-all ${p.stock > 0 ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                        <button
                          onClick={() => handleUpdateStock(p.id, p.stock - 1)}
                          disabled={p.stock <= 0 || accionId !== null}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 active:scale-90"
                        >
                          -
                        </button>
                        
                        <span className="min-w-[4ch] text-center">
                          ● {p.stock} unid.
                        </span>

                        <button
                          onClick={() => handleUpdateStock(p.id, p.stock + 1)}
                          disabled={accionId !== null}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-neutral-300 hover:bg-neutral-100 active:scale-90"
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
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300"
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
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 flex-shrink-0 shadow-sm">
                    {p.imagenUrl ? (
                      <Image src={p.imagenUrl} alt={p.nombre} fill className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[10px] text-neutral-400 font-medium">Sin img</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-black">{p.nombre}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm font-semibold text-black">{formatearCLP(p.precio)}</p>
                      {/* Stock móvil con botones integrados */}
                      <div className={`flex items-center gap-2 rounded-full border px-2 py-1 text-[10px] font-bold ${p.stock > 0 ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                        <button onClick={() => handleUpdateStock(p.id, p.stock - 1)} className="h-5 w-5 bg-white rounded-full border">-</button>
                        <span>{p.stock}</span>
                        <button onClick={() => handleUpdateStock(p.id, p.stock + 1)} className="h-5 w-5 bg-white rounded-full border">+</button>
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

          <div className="relative w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-black">
                  {editId ? "Editar producto" : "Registrar producto"}
                </h2>
                <p className="mt-1 text-sm text-neutral-600 font-medium">Ingresa la información detallada para la tienda.</p>
              </div>

              <button
                onClick={cerrarModal}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-sm font-bold text-black hover:bg-neutral-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide">Nombre del producto *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  onBlur={() => setTouched((p) => ({ ...p, nombre: true }))}
                  placeholder="Ej: Cera Mate Premium"
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-black outline-none transition-all ${
                    nombreError ? "border-red-400" : "border-neutral-200 focus:border-black"
                  }`}
                />
                {nombreError && <p className="text-xs text-red-600 font-medium">{nombreError}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide">Precio (CLP) *</label>
                <input
                  type="number"
                  value={form.precio}
                  onChange={(e) => setForm((p) => ({ ...p, precio: e.target.value ? Number(e.target.value) : "" }))}
                  onBlur={() => setTouched((p) => ({ ...p, precio: true }))}
                  placeholder="Ej: 15000"
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-black outline-none ${
                    precioError ? "border-red-400" : "border-neutral-200 focus:border-black"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide">Stock Inicial *</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value ? Number(e.target.value) : "" }))}
                  onBlur={() => setTouched((p) => ({ ...p, stock: true }))}
                  placeholder="Ej: 10"
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-black outline-none ${
                    stockError ? "border-red-400" : "border-neutral-200 focus:border-black"
                  }`}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide">Foto del producto (subir)</label>
                <div className="flex items-center gap-4 mt-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  {form.imagenUrl && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-neutral-200 bg-white flex-shrink-0 shadow-sm">
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
                      <p className="text-[10px] text-neutral-500 font-medium tracking-tight">JPG/PNG. Máx 10MB.</p>
                      {uploadingFoto && <p className="text-[10px] font-bold text-blue-600 animate-pulse">SUBIENDO...</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide">Descripción</label>
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
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-neutral-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={() => void guardar()}
                className="rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50 transition-all active:scale-95"
                disabled={!canSave || uploadingFoto || accionId === (editId ?? "create")}
              >
                {accionId === (editId ?? "create") ? "Guardando..." : "Confirmar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de Eliminación */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cancelarEliminar} />

          <div className="relative w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-8 shadow-2xl text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600 mb-4 font-bold text-xl">!</div>
            <h3 className="text-lg font-bold text-black">¿Eliminar producto?</h3>
            <p className="mt-2 text-sm text-neutral-600 font-medium">
              Esta acción no se puede deshacer y el producto desaparecerá de la tienda permanentemente.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <button
                onClick={() => void confirmarEliminar()}
                disabled={accionId === confirm.id}
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {accionId === confirm.id ? "Eliminando..." : "Sí, eliminar producto"}
              </button>
              
              <button
                onClick={cancelarEliminar}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-black hover:bg-neutral-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}