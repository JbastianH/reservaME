"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBarberoMe } from "@/lib/useBarberoMe";
import { patchBarberoMe } from "@/services/barbero-perfil.service";
import PortafolioPanel from "@/componentes/barbero/PortafolioPanel";
import { subirImagenCloudinary } from "@/lib/cloudinaryUpload";
import HorarioBarberoPanel from "@/componentes/barbero/HorarioBarberoPanel";

function isValidUrl(v: string) {
  if (!v.trim()) return true;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

export default function BarberoPerfilPage() {
  const { data, loading, error, refetch } = useBarberoMe();

  const [form, setForm] = useState({
    bio: "",
    phone: "",
    photoUrl: ""
  });

  const [touched, setTouched] = useState({
    bio: false,
    phone: false,
    photoUrl: false,
  });

  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [uploadingFoto, setUploadingFoto] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data) return;
    setForm({
      bio: data.bio ?? "",
      phone: data.phone ?? "",
      photoUrl: data.photoUrl ?? "",
    });
    setTouched({ bio: false, phone: false, photoUrl: false });
  }, [data]);

  const photoUrlError = useMemo(() => {
    if (!touched.photoUrl) return "";
    if (!isValidUrl(form.photoUrl)) return "La URL no parece válida.";
    return "";
  }, [form.photoUrl, touched.photoUrl]);

  const canSave = useMemo(() => {
    return !photoUrlError;
  }, [photoUrlError]);

  async function guardar() {
    setOk("");
    setErr("");
    setTouched({ bio: true, phone: true, photoUrl: true });

    if (!canSave) {
      setErr("Revisa los campos marcados.");
      return;
    }

    try {
      setBusy(true);

      const dto: any = {
        bio: form.bio.trim() || undefined,
        phone: form.phone.trim() || undefined,
        photoUrl: form.photoUrl.trim() || undefined,
      };

      await patchBarberoMe(dto);
      setOk("Perfil actualizado ✔︎");
      await refetch();
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "No se pudo guardar el perfil.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubirFoto(file: File) {
    setOk("");
    setErr("");

    if (file.size > 10 * 1024 * 1024) {
      setErr("La imagen es muy pesada (máx 10MB).");
      return;
    }

    try {
      setUploadingFoto(true);

      const up = await subirImagenCloudinary({
        file,
        variant: "perfil",
        folder: "bawstudio/barberos/perfil",
      });

      setForm((p) => ({ ...p, photoUrl: up.secureUrl }));
      setTouched((p) => ({ ...p, photoUrl: true }));

      await patchBarberoMe({ photoUrl: up.secureUrl });

      setOk("Foto actualizada ✔︎");
      await refetch();
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "No se pudo subir la foto.");
    } finally {
      setUploadingFoto(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Mi perfil</h1>
        <p className="mt-1 text-sm text-neutral-600">Edita tu bio, teléfono, foto y link de agenda.</p>
      </div>

      {/* Banners de carga, error y ok se mantienen igual... */}
      {loading && <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">Cargando perfil...</div>}
      {!loading && error && <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {ok && <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">{ok}</div>}
      {err && <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{err}</div>}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Preview */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-medium text-neutral-500">Preview</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                  {form.photoUrl.trim() && <img src={form.photoUrl.trim()} alt="Foto de perfil" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-black">{data.name}</p>
                  <p className="text-xs text-neutral-500">/{data.slug}</p>
                  <p className="text-xs text-neutral-700">{data.user?.email ?? "—"}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                <p className="text-neutral-700"><span className="font-medium">Tel:</span> {form.phone.trim() || "—"}</p>
                <p className="text-neutral-700"><span className="font-medium">Bio:</span> {form.bio.trim() || "—"}</p>
              </div>
            </div>

            {/* Form */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-neutral-600">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    onBlur={() => setTouched((p) => ({ ...p, bio: true }))}
                    disabled={busy}
                    className="min-h-[110px] w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600">Teléfono</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                    disabled={busy}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black disabled:opacity-50"
                  />
                </div>

                {/* FOTO */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-600">Foto (subir)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={busy || uploadingFoto}
                    className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border file:border-neutral-300 file:bg-white file:px-3 file:py-2 file:text-sm file:text-black hover:file:bg-neutral-50 disabled:opacity-50"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await onSubirFoto(file);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">JPG/PNG. Máx 10MB.</p>
                    {uploadingFoto && <p className="text-xs text-neutral-500">Subiendo...</p>}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => void refetch()}
                  disabled={busy}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
                >
                  Recargar
                </button>
                <button
                  onClick={() => void guardar()}
                  disabled={!canSave || busy}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {busy ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
          <HorarioBarberoPanel />
          <PortafolioPanel />
        </>
      )}
    </section>
  );
}