"use client";

import Image from "next/image";
import { useState } from "react";
import { useMiPortafolio } from "@/lib/useMiPortafolio";
import { subirImagenCloudinary } from "@/lib/cloudinaryUpload";
import {
  crearFotoPortafolio,
  setVisibleFotoPortafolio,
} from "@/services/barbero-portafolio.service";

import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

function safeImageSrc(src?: string | null) {
  const s = (src ?? "").trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  return null;
}

type ToggleFotoTarget = {
  id: string;
  visible: boolean;
};

export default function PortafolioPanel() {
  const { data, loading, error, refetch } = useMiPortafolio();
  const items = data ?? [];

  const [busy, setBusy] = useState(false);

  const [toggleFotoTarget, setToggleFotoTarget] = useState<ToggleFotoTarget | null>(null);

  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    title: "",
    message: "",
    variant: "success" as "success" | "error",
  });

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

  async function onUpload(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      mostrarFeedback({
        title: "Imagen muy pesada",
        message: "La imagen supera el peso máximo permitido de 10MB.",
        variant: "error",
      });
      return;
    }

    setBusy(true);

    try {
      const upload = await subirImagenCloudinary({
        file,
        variant: "portafolio",
        folder: "bawstudio/barberos/portafolio",
      });

      await crearFotoPortafolio({ imageUrl: upload.secureUrl });

      mostrarFeedback({
        title: "Foto subida",
        message: "La foto fue agregada correctamente a tu portafolio.",
        variant: "success",
      });

      await refetch();
    } catch (e: any) {
      mostrarFeedback({
        title: "No se pudo subir la foto",
        message: e?.message ? String(e.message) : "No se pudo subir la foto.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  function abrirToggleVisible(id: string, visible: boolean) {
    setToggleFotoTarget({
      id,
      visible,
    });
  }

  function cerrarToggleVisible() {
    if (busy) return;
    setToggleFotoTarget(null);
  }

  async function confirmarToggleVisible() {
    if (!toggleFotoTarget) return;

    const nextVisible = !toggleFotoTarget.visible;

    setBusy(true);

    try {
      await setVisibleFotoPortafolio(toggleFotoTarget.id, nextVisible);

      setToggleFotoTarget(null);

      mostrarFeedback({
        title: nextVisible ? "Foto visible" : "Foto oculta",
        message: nextVisible
          ? "La foto ahora será visible en tu perfil público."
          : "La foto fue ocultada de tu perfil público.",
        variant: "success",
      });

      await refetch();
    } catch (e: any) {
      mostrarFeedback({
        title: "No se pudo actualizar",
        message: e?.message
          ? String(e.message)
          : "No se pudo actualizar la visibilidad de la foto.",
        variant: "error",
      });
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
                        onClick={() => abrirToggleVisible(x.id, x.visible)}
                        className={[
                          "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
                          x.visible
                            ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
                            : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50",
                        ].join(" ")}
                        title={x.hiddenByAdmin ? "El admin ocultó esta foto" : ""}
                      >
                        {busy ? "Guardando..." : x.visible ? "Ocultar" : "Mostrar"}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )
      ) : null}

      <ConfirmDialog
        open={Boolean(toggleFotoTarget)}
        title={toggleFotoTarget?.visible ? "Ocultar foto" : "Mostrar foto"}
        message={
          toggleFotoTarget
            ? toggleFotoTarget.visible
              ? "¿Seguro que quieres ocultar esta foto? No aparecerá en tu perfil público."
              : "¿Seguro que quieres mostrar esta foto? Volverá a aparecer en tu perfil público."
            : ""
        }
        confirmText={
          busy ? "Guardando..." : toggleFotoTarget?.visible ? "Sí, ocultar" : "Sí, mostrar"
        }
        cancelText="Volver"
        variant={toggleFotoTarget?.visible ? "danger" : "default"}
        onConfirm={() => void confirmarToggleVisible()}
        onClose={cerrarToggleVisible}
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
