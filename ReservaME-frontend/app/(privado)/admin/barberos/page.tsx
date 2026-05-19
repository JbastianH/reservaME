"use client";

import { useMemo, useState } from "react";
import { useAdminBarberos } from "@/lib/useAdminBarberos";
import {
  activarBarberoAdmin,
  actualizarBarberoAdmin,
  desactivarBarberoAdmin,
} from "@/services/admin-barberos.service";
import { crearUserAdmin, reenviarActivacionAdmin } from "@/services/admin-users.service";
import Link from "next/link";

type BarberoItem = {
  id: string;
  name: string;
  slug: string;
  linkSetmore: string; // <-- Agregado
  bio?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  userId: string | null;
  user?: { email: string; isActive: boolean } | null;
};

type FormState = {
  name: string;
  slug: string;
  linkSetmore: string; // <-- Agregado

  // SOLO al CREAR (para crear el usuario BARBERO)
  email: string;

  // Opcionales del barbero (pero se muestran)
  bio: string;
  phone: string;
  photoUrl: string;
};

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidSlug(v: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.trim());
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function AdminBarberosPage() {
  const { data, loading, error, refetch } = useAdminBarberos();
  const barberos: BarberoItem[] = (data ?? []) as any;

  // Filtros
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"TODOS" | "ACTIVOS" | "INACTIVOS">("TODOS");

  // Modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    linkSetmore: "", // <-- Inicializado
    email: "",
    bio: "",
    phone: "",
    photoUrl: "",
  });

  const [touched, setTouched] = useState<{
    name: boolean;
    slug: boolean;
    linkSetmore: boolean; // <-- Agregado
    email: boolean;
    bio: boolean;
    phone: boolean;
    photoUrl: boolean;
  }>({
    name: false,
    slug: false,
    linkSetmore: false, // <-- Inicializado
    email: false,
    bio: false,
    phone: false,
    photoUrl: false,
  });

  // Slug autogenerado: solo en CREATE mientras no sea manual
  const [slugManual, setSlugManual] = useState(false);

  // Confirmación activar/desactivar
  const [confirm, setConfirm] = useState<{
    open: boolean;
    id: string | null;
    nextActive: boolean;
  }>({ open: false, id: null, nextActive: true });

  // Mensajes UI
  const [bannerOk, setBannerOk] = useState("");
  const [bannerError, setBannerError] = useState("");

  // Busy
  const [accionId, setAccionId] = useState<string | null>(null);

  function resetBanners() {
    setBannerOk("");
    setBannerError("");
  }

  const nameError = useMemo(() => {
    if (!touched.name) return "";
    const v = form.name.trim();
    if (!v) return "El nombre es obligatorio.";
    if (v.length < 3) return "El nombre debe tener al menos 3 caracteres.";
    return "";
  }, [form.name, touched.name]);

  const slugError = useMemo(() => {
    if (!touched.slug) return "";
    const v = form.slug.trim();
    if (!v) return "El slug es obligatorio.";
    if (v.length < 3) return "El slug debe tener al menos 3 caracteres.";
    if (!isValidSlug(v))
      return "Slug inválido. Usa minúsculas, números y guiones (ej: juan-perez).";
    return "";
  }, [form.slug, touched.slug]);

  // --- Nueva Validación ---
  const linkSetmoreError = useMemo(() => {
    if (!touched.linkSetmore) return "";
    const v = form.linkSetmore.trim();
    if (!v) return "El link de reserva es obligatorio.";
    if (!v.startsWith("http")) return "Debe ser una URL válida (http/https).";
    return "";
  }, [form.linkSetmore, touched.linkSetmore]);

  const emailError = useMemo(() => {
    // Email solo se exige cuando creas (no al editar)
    if (editId) return "";
    if (!touched.email) return "";
    const v = form.email.trim();
    if (!v) return "El correo es obligatorio.";
    if (!isValidEmail(v)) return "Ingresa un correo válido.";
    return "";
  }, [form.email, touched.email, editId]);

  const canSave = useMemo(() => {
    const commonValid = !nameError && !slugError && !linkSetmoreError && form.name.trim() && form.slug.trim() && form.linkSetmore.trim();
    if (editId) {
      return commonValid;
    }
    return (
      commonValid &&
      !emailError &&
      form.name.trim() &&
      form.slug.trim() &&
      form.email.trim()
    );
  }, [editId, nameError, slugError, linkSetmoreError, emailError, form.name, form.slug, form.email, form.linkSetmore]);

  const barberosFiltrados = useMemo(() => {
    const query = q.trim().toLowerCase();

    return barberos
      .filter((b) => {
        if (estado === "ACTIVOS" && !b.isActive) return false;
        if (estado === "INACTIVOS" && b.isActive) return false;

        if (query) {
          const email = b.user?.email ?? "";
          const text = `${b.name} ${b.slug} ${email}`.toLowerCase();
          if (!text.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [barberos, q, estado]);

  function abrirCrear() {
    resetBanners();
    setEditId(null);
    setSlugManual(false);
    setForm({
      name: "",
      slug: "",
      linkSetmore: "",
      email: "",
      bio: "",
      phone: "",
      photoUrl: "",
    });
    setTouched({
      name: false,
      slug: false,
      linkSetmore: false,
      email: false,
      bio: false,
      phone: false,
      photoUrl: false,
    });
    setModalOpen(true);
  }

  function abrirEditar(item: BarberoItem) {
    resetBanners();
    setEditId(item.id);
    setSlugManual(true); // en editar NO se autogenera
    setForm({
      name: item.name ?? "",
      slug: item.slug ?? "",
      linkSetmore: item.linkSetmore ?? "", // Cargado
      email: item.user?.email ?? "", // solo visual, NO se envía al backend en UPDATE
      bio: item.bio ?? "",
      phone: item.phone ?? "",
      photoUrl: item.photoUrl ?? "",
    });
    setTouched({
      name: false,
      slug: false,
      linkSetmore: false,
      email: false,
      bio: false,
      phone: false,
      photoUrl: false,
    });
    setModalOpen(true);
  }

  function cerrarModal() {
    if (accionId) return;
    setModalOpen(false);
    setEditId(null);
  }

  async function guardar() {
    resetBanners();
    setTouched((p) => ({ ...p, name: true, slug: true, email: true, linkSetmore: true }));

    if (!canSave) {
      setBannerError("Revisa los campos marcados.");
      return;
    }

    const payloadName = form.name.trim();
    const payloadSlug = form.slug.trim();
    const payloadLinkSetmore = form.linkSetmore.trim();
    const payloadEmail = form.email.trim().toLowerCase();

    const payloadBio = form.bio.trim() || undefined;
    const payloadPhone = form.phone.trim() || undefined;
    const payloadPhotoUrl = form.photoUrl.trim() || undefined;

    try {
      setAccionId(editId ?? "__create__");

      // ===== CREATE =====
      if (!editId) {
        if (!payloadEmail || !isValidEmail(payloadEmail)) {
          setBannerError("Ingresa un correo válido para crear el usuario.");
          return;
        }

        // 1) Crear usuario BARBERO
        const user = await crearUserAdmin({
          email: payloadEmail,
          role: "BARBERO",
          name: payloadName,
          slug: payloadSlug,
          linkSetmore: payloadLinkSetmore, // Agregado al payload
          bio: payloadBio,
          phone: payloadPhone,
          photoUrl: payloadPhotoUrl,
        });

        setBannerOk("Barbero creado ✔︎ (usuario creado para activación)");
        setModalOpen(false);
        await refetch();
        return;
      }

      // ===== UPDATE (sin email) =====
      await actualizarBarberoAdmin(editId, {
        name: payloadName,
        slug: payloadSlug,
        linkSetmore: payloadLinkSetmore, // Agregado al payload
        bio: payloadBio,
        phone: payloadPhone,
        photoUrl: payloadPhotoUrl,
      });

      setBannerOk("Barbero actualizado ✔︎");
      setModalOpen(false);
      await refetch();
    } catch (e: any) {
      setBannerError(e?.message ? String(e.message) : "No se pudieron guardar los cambios.");
    } finally {
      setAccionId(null);
    }
  }

  function pedirToggle(item: BarberoItem) {
    resetBanners();
    setConfirm({ open: true, id: item.id, nextActive: !item.isActive });
  }

  async function confirmarToggle() {
    if (!confirm.id) return;

    resetBanners();

    try {
      setAccionId(confirm.id);

      if (confirm.nextActive) await activarBarberoAdmin(confirm.id);
      else await desactivarBarberoAdmin(confirm.id);

      setBannerOk(confirm.nextActive ? "Barbero activado ✔︎" : "Barbero desactivado ✔︎");
      setConfirm({ open: false, id: null, nextActive: true });
      await refetch();
    } catch (e: any) {
      setBannerError(
        e?.message ? String(e.message) : "No se pudo actualizar el estado del barbero.",
      );
    } finally {
      setAccionId(null);
    }
  }

  function cancelarToggle() {
    if (accionId) return;
    setConfirm({ open: false, id: null, nextActive: true });
  }

  async function reenviarCorreo(item: BarberoItem) {
    if (!item.user?.email) return; // Validación de seguridad
    if (item.user.isActive) return; // Doble validación: si está activo, no hace nada

    resetBanners();

    try {
      setAccionId(item.id);

      // Llamar al servicio
      await reenviarActivacionAdmin({ email: item.user.email });

      setBannerOk(`Correo de activación reenviado a ${item.user.email} ✔︎`);
    } catch (e: any) {
      setBannerError(e?.message || "No se pudo reenviar el correo.");
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
          <h1 className="text-2xl font-semibold text-black">Barberos</h1>
          <p className="mt-1 text-sm text-neutral-600">Crea, edita y activa/desactiva barberos.</p>
        </div>

        <button
          onClick={abrirCrear}
          disabled={Boolean(accionId)}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          + Crear barbero
        </button>
      </div>

      {bannerOk ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          {bannerOk}
        </div>
      ) : null}

      {bannerError ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {bannerError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-neutral-600">Buscar</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre, slug o correo..."
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

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          Cargando barberos...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-600">
                <tr>
                  <th className="px-4 py-3">Barbero</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Cuenta</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {barberosFiltrados.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-500" colSpan={5}>
                      No hay barberos con esos filtros.
                    </td>
                  </tr>
                ) : (
                  barberosFiltrados.map((b) => {
                    const rowBusy = accionId === b.id;

                    return (
                      <tr key={b.id} className="border-t border-neutral-100">
                        {/* Barbero */}
                        <td className="px-4 py-3">
                          <div className="font-medium text-black">{b.name}</div>
                          <div className="text-xs text-neutral-500">/{b.slug}</div>
                        </td>

                        {/* Correo */}
                        <td className="px-4 py-3 text-neutral-800">{b.user?.email ?? "—"}</td>

                        {/* Cuenta (usuario activado o no) */}
                        <td className="px-4 py-3">
                          {b.user?.isActive ? (
                            <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700">
                              ACTIVADA
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-700">
                              PENDIENTE
                            </span>
                          )}
                        </td>

                        {/* Estado barbero */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${pillActivo(
                              b.isActive,
                            )}`}
                          >
                            {b.isActive ? "ACTIVO" : "INACTIVO"}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => abrirEditar(b)}
                              disabled={Boolean(accionId)}
                              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-black hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {rowBusy ? "Procesando..." : "Editar"}
                            </button>

                            <button
                              onClick={() => pedirToggle(b)}
                              disabled={Boolean(accionId)}
                              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-black hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {rowBusy ? "Procesando..." : b.isActive ? "Desactivar" : "Activar"}
                            </button>
                            {!b.user?.isActive && b.user?.email && (
                              <button
                                onClick={() => reenviarCorreo(b)}
                                disabled={Boolean(accionId)}
                                className="rounded-lg border border-neutral-300 bg-yellow-50 px-3 py-1.5 text-xs text-yellow-800 hover:bg-yellow-100 disabled:opacity-50"
                                title="Reenviar correo de activación"
                              >
                                {accionId === b.id ? "Enviando..." : "Reenviar Email"}
                              </button>
                            )}
                            <Link
                              href={`/admin/barberos/${b.id}/servicios`}
                              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-black hover:bg-neutral-50"
                            >
                              Servicios
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {barberosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                No hay barberos con esos filtros.
              </div>
            ) : (
              barberosFiltrados.map((b) => {
                const rowBusy = accionId === b.id;

                const pillCuenta = b.user?.isActive
                  ? "bg-sky-500/10 text-sky-700 border-sky-500/30"
                  : "bg-amber-500/10 text-amber-800 border-amber-500/30";

                return (
                  <div key={b.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-black">{b.name}</p>
                        <p className="mt-1 text-xs text-neutral-500">/{b.slug}</p>
                        <p className="mt-1 text-xs text-neutral-700">{b.user?.email ?? "—"}</p>

                        {/* Estado cuenta (usuario) */}
                        <div className="mt-2">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${pillCuenta}`}
                          >
                            {b.user?.isActive ? "CUENTA ACTIVADA" : "CUENTA PENDIENTE"}
                          </span>
                        </div>
                      </div>

                      {/* Estado barbero */}
                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${pillActivo(b.isActive)}`}
                      >
                        {b.isActive ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </div>

                    {/* === INICIO DE LA MODIFICACIÓN: Scroll Horizontal Centrado === */}

                    {/* 1. Contenedor Externo: Habilita el scroll (overflow) */}
                    <div className="mt-4 flex w-full overflow-x-auto pb-2">
                      {/* 2. Contenedor Interno: Agrupa los botones y se centra con m-auto */}
                      <div className="m-auto flex gap-2">
                        <button
                          onClick={() => abrirEditar(b)}
                          disabled={Boolean(accionId)}
                          // Agregamos shrink-0 y whitespace-nowrap, quitamos flex-1
                          className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm whitespace-nowrap text-black hover:bg-neutral-50 disabled:opacity-50"
                        >
                          {rowBusy ? "Procesando..." : "Editar"}
                        </button>

                        <button
                          onClick={() => pedirToggle(b)}
                          disabled={Boolean(accionId)}
                          className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm whitespace-nowrap text-black hover:bg-neutral-50 disabled:opacity-50"
                        >
                          {rowBusy ? "Procesando..." : b.isActive ? "Desactivar" : "Activar"}
                        </button>

                        {!b.user?.isActive && b.user?.email && (
                          <button
                            onClick={() => reenviarCorreo(b)}
                            disabled={Boolean(accionId)}
                            className="shrink-0 rounded-lg border border-neutral-300 bg-yellow-50 px-3 py-1.5 text-xs whitespace-nowrap text-yellow-800 hover:bg-yellow-100 disabled:opacity-50"
                            title="Reenviar correo de activación"
                          >
                            {accionId === b.id ? "Enviando..." : "Reenviar Email"}
                          </button>
                        )}

                        <Link
                          href={`/admin/barberos/${b.id}/servicios`}
                          className="shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-center text-sm whitespace-nowrap text-black hover:bg-neutral-50"
                        >
                          Servicios
                        </Link>
                      </div>
                    </div>
                    {/* === FIN DE LA MODIFICACIÓN === */}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : null}

      {/* Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={cerrarModal} />

          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-black">
                  {editId ? "Editar barbero" : "Crear barbero"}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {editId
                    ? "Edita nombre/slug y datos opcionales. El correo se gestiona en el usuario."
                    : "El correo se usará para crear el usuario BARBERO y enviar activación."}
                </p>
              </div>

              <button
                onClick={cerrarModal}
                disabled={Boolean(accionId)}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((p) => ({
                      ...p,
                      name,
                      slug: !editId && !slugManual ? slugify(name) : p.slug,
                    }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                  disabled={Boolean(accionId)}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none ${
                    nameError ? "border-red-400" : "border-neutral-300 focus:border-black"
                  }`}
                  placeholder="Ej: Juan Pérez"
                />
                {nameError ? <p className="text-xs text-red-600">{nameError}</p> : null}
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Slug *</label>
                <input
                  value={form.slug}
                  readOnly
                  onChange={(e) => {
                    setSlugManual(true);
                    setForm((p) => ({ ...p, slug: e.target.value }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, slug: true }))}
                  disabled={Boolean(accionId)}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none ${
                    slugError ? "border-red-400" : "border-neutral-300 focus:border-black"
                  }`}
                  placeholder="Ej: juan-perez"
                />
                {slugError ? <p className="text-xs text-red-600">{slugError}</p> : null}
              </div>

              {/* Email (solo CREATE) */}
              {!editId ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600">Correo *</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                    disabled={Boolean(accionId)}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none ${
                      emailError ? "border-red-400" : "border-neutral-300 focus:border-black"
                    }`}
                    placeholder="correo@ejemplo.com"
                  />
                  {emailError ? <p className="text-xs text-red-600">{emailError}</p> : null}
                </div>
              ) : null}

              {/* Link de Reserva (Setmore) - NUEVO CAMPO */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600 font-bold">Link para reservas *</label>
                <input
                  value={form.linkSetmore}
                  onChange={(e) => setForm((p) => ({ ...p, linkSetmore: e.target.value }))}
                  onBlur={() => setTouched((p) => ({ ...p, linkSetmore: true }))}
                  disabled={Boolean(accionId)}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-black outline-none ${
                    linkSetmoreError ? "border-red-400" : "border-neutral-300 focus:border-black"
                  }`}
                  placeholder="https://booking.setmore.com/..."
                />
                {linkSetmoreError ? <p className="text-xs text-red-600">{linkSetmoreError}</p> : null}
              </div>

              {/* Bio (opcional) */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Bio (opcional)</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  onBlur={() => setTouched((p) => ({ ...p, bio: true }))}
                  disabled={Boolean(accionId)}
                  className="min-h-[90px] w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black disabled:opacity-50"
                  placeholder="Breve descripción del barbero..."
                />
              </div>

              {/* Phone (opcional) */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-600">Teléfono (opcional)</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                  disabled={Boolean(accionId)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black disabled:opacity-50"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={cerrarModal}
                disabled={Boolean(accionId)}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={() => void guardar()}
                disabled={!canSave || Boolean(accionId)}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {accionId ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirm toggle */}
      {confirm.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={cancelarToggle} />

          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-black">Confirmación</h3>
            <p className="mt-2 text-sm text-neutral-700">
              ¿Seguro que quieres {confirm.nextActive ? "activar" : "desactivar"} este barbero?
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={cancelarToggle}
                disabled={Boolean(accionId)}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={() => void confirmarToggle()}
                disabled={Boolean(accionId)}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {accionId ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}