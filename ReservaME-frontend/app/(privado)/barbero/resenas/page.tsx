"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listarMisResenas,
  setVisibleMiResena,
  type BarberoResenaItem,
} from "@/services/barbero-resenas.service";
import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? "text-black" : "text-neutral-300"}>
          ★
        </span>
      ))}
      <span className="ml-2 text-xs text-neutral-600">{rating}/5</span>
    </div>
  );
}

type ToggleResenaTarget = {
  id: string;
  clientName: string;
  visible: boolean;
};

export default function BarberoResenasPage() {
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BarberoResenaItem[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const [accionId, setAccionId] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const [toggleTarget, setToggleTarget] = useState<ToggleResenaTarget | null>(null);

  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    title: "",
    message: "",
    variant: "success" as "success" | "error",
  });

  const params = useMemo(() => {
    return {
      page,
      pageSize,
      q: q.trim() ? q.trim() : undefined,
      visible: visible === "" ? undefined : visible === "true",
    };
  }, [page, pageSize, q, visible]);

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

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await listarMisResenas(params);
      setItems(r.items);
      setTotal(r.total);
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "No se pudieron cargar tus reseñas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params]);

  function abrirToggleResena(it: BarberoResenaItem) {
    setToggleTarget({
      id: it.id,
      clientName: it.reservation?.clientName ?? "este cliente",
      visible: it.visible,
    });
  }

  function cerrarToggleResena() {
    if (accionId === toggleTarget?.id) return;
    setToggleTarget(null);
  }

  async function confirmarToggleResena() {
    if (!toggleTarget) return;

    const nextVisible = !toggleTarget.visible;

    try {
      setAccionId(toggleTarget.id);

      await setVisibleMiResena(toggleTarget.id, nextVisible);

      setToggleTarget(null);

      mostrarFeedback({
        title: nextVisible ? "Reseña visible" : "Reseña oculta",
        message: nextVisible
          ? "La reseña ahora será visible en tu perfil público."
          : "La reseña fue ocultada de tu perfil público.",
        variant: "success",
      });

      await load();
    } catch (e: any) {
      mostrarFeedback({
        title: "No se pudo actualizar",
        message: e?.message
          ? String(e.message)
          : "No se pudo actualizar la visibilidad de la reseña.",
        variant: "error",
      });
    } finally {
      setAccionId(null);
    }
  }

  function onChangeFiltro() {
    setPage(1);
  }
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Mis reseñas</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Puedes ocultar o mostrar reseñas de tu perfil público.
        </p>
      </div>
      {err ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-neutral-600">Buscar</label>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                onChangeFiltro();
              }}
              placeholder="Comentario..."
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600">Visibilidad</label>
            <select
              value={visible}
              onChange={(e) => {
                setVisible(e.target.value as any);
                onChangeFiltro();
              }}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
            >
              <option value="">Todas</option>
              <option value="true">Solo visibles</option>
              <option value="false">Solo ocultas</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          Cargando reseñas...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
                No hay reseñas con esos filtros.
              </div>
            ) : (
              items.map((it) => {
                const busy = accionId === it.id;
                return (
                  <div key={it.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Stars rating={it.rating} />
                        <p className="text-m mt-2 text-black">
                          {it.reservation?.clientName ?? "-"}
                        </p>
                        <p className="mt-2 text-sm text-neutral-800">
                          {it.comment?.trim() ? it.comment : "— Sin comentario —"}
                        </p>
                        <p className="mt-2 text-xs text-neutral-500">
                          {formatDateTime(it.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
                            it.visible
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                              : "border-neutral-400/40 bg-neutral-500/10 text-neutral-700"
                          }`}
                        >
                          {it.visible ? "VISIBLE" : "OCULTA"}
                        </span>

                        <button
                          onClick={() => abrirToggleResena(it)}
                          disabled={busy}
                          className={[
                            "rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                            it.visible
                              ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
                              : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50",
                          ].join(" ")}
                        >
                          {busy ? "Guardando..." : it.visible ? "Ocultar" : "Mostrar"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Página <span className="font-medium text-black">{page}</span> de{" "}
              <span className="font-medium text-black">{totalPages}</span> • Total:{" "}
              <span className="font-medium text-black">{total}</span>
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.visible ? "Ocultar reseña" : "Mostrar reseña"}
        message={
          toggleTarget
            ? toggleTarget.visible
              ? `¿Seguro que quieres ocultar la reseña de ${toggleTarget.clientName}? No aparecerá en tu perfil público.`
              : `¿Seguro que quieres mostrar la reseña de ${toggleTarget.clientName}? Volverá a aparecer en tu perfil público.`
            : ""
        }
        confirmText={
          accionId === toggleTarget?.id
            ? "Guardando..."
            : toggleTarget?.visible
              ? "Sí, ocultar"
              : "Sí, mostrar"
        }
        cancelText="Volver"
        variant={toggleTarget?.visible ? "danger" : "default"}
        onConfirm={() => void confirmarToggleResena()}
        onClose={cerrarToggleResena}
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
