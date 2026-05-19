"use client";

import Image from "next/image";
import { useState } from "react";
import { useMiPortafolio } from "@/lib/useMiPortafolio";
import { subirImagenCloudinary } from "@/lib/cloudinaryUpload";
import {
  crearFotoPortafolio,
  eliminarFotoPortafolio,
  setVisibleFotoPortafolio,
} from "@/services/barbero-portafolio.service";

function safeImageSrc(src?: string | null) {
  const s = (src ?? "").trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  return null;
}

export default function PortafolioPanel() {
  const { data, loading, error, refetch } = useMiPortafolio();
  const items = data ?? [];

  const [busy, setBusy] = useState(false);
  const [bannerOk, setBannerOk] = useState("");
  const [bannerError, setBannerError] = useState("");

  function resetBanners() {
    setBannerOk("");
    setBannerError("");
  }

  async function onUpload(file: File) {
    resetBanners();
    setBusy(true);

    try {
      const upload = await subirImagenCloudinary({
        file,
        variant: "portafolio",
        folder: "bawstudio/barberos/portafolio",
      });

      await crearFotoPortafolio({ imageUrl: upload.secureUrl });

      setBannerOk("Foto subida al portafolio ✔︎");
      await refetch();
    } catch (e: any) {
      setBannerError(e?.message ? String(e.message) : "No se pudo subir la foto.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisible(id: string, current: boolean) {
    resetBanners();
    setBusy(true);
    try {
      await setVisibleFotoPortafolio(id, !current);
      setBannerOk(!current ? "Foto visible ✔︎" : "Foto oculta ✔︎");
      await refetch();
    } catch (e: any) {
      setBannerError(e?.message ? String(e.message) : "No se pudo actualizar visibilidad.");
    } finally {
      setBusy(false);
    }
  }

  async function eliminar(id: string) {
    resetBanners();
    setBusy(true);
    try {
      await eliminarFotoPortafolio(id);
      setBannerOk("Foto eliminada (borrado lógico) ✔︎");
      await refetch();
    } catch (e: any) {
      setBannerError(e?.message ? String(e.message) : "No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">Portafolio</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Sube fotos de tus trabajos. Puedes ocultarlas mas tarde.
            </p>
          </div>

          <label
            className={`inline-flex cursor-pointer items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 ${busy ? "pointer-events-none opacity-50" : ""}`}
          >
            {busy ? "Subiendo..." : "+ Subir foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
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

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          Cargando portafolio...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        items.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            Aún no tienes fotos en tu portafolio.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((x) => {
                const src = safeImageSrc(x.imageUrl);

                return (
                  <div
                    key={x.id}
                    className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
                  >
                    <div className="relative aspect-square w-full bg-neutral-100">
                      {src ? (
                        <Image src={src} alt="Foto portafolio" fill className="object-cover" />
                      ) : null}

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-2">
                        {!x.visible ? (
                          <span className="rounded-full bg-black/70 px-2 py-1 text-[11px] text-white">
                            OCULTA
                          </span>
                        ) : null}
                        {x.hiddenByAdmin ? (
                          <span className="rounded-full bg-red-600/80 px-2 py-1 text-[11px] text-white">
                            OCULTA POR ADMIN
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex gap-2 p-3">
                      <button
                        disabled={busy || x.hiddenByAdmin}
                        onClick={() => void toggleVisible(x.id, x.visible)}
                        className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-black hover:bg-neutral-50 disabled:opacity-50"
                        title={x.hiddenByAdmin ? "El admin ocultó esta foto" : ""}
                      >
                        {x.visible ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )
      ) : null}
    </section>
  );
}
