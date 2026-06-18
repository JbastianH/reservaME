"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBarberoServicios } from "@/lib/useBarberoServicios";
import { actualizarMiServicioBarbero } from "@/services/barbero-servicios.service";
import ConfirmDialog from "@/componentes/ui/ConfirmDialog";
import FeedbackDialog from "@/componentes/ui/FeedbackDialog";

type EditState = {
  price: string;
  durationMin: string;
};

type ToggleServicioTarget = {
  id: string;
  name: string;
  nextActive: boolean;
};

function formatCLP(value: string) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("es-CL");
}

export default function BarberoServiciosPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useBarberoServicios();

  const [accionId, setAccionId] = useState<string | null>(null);

  const [toggleTarget, setToggleTarget] = useState<ToggleServicioTarget | null>(null);

  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    title: "",
    message: "",
    variant: "success" as "success" | "error",
  });

  // inputs controlados por item
  const initialEdits = useMemo(() => {
    const map = new Map<string, EditState>();
    data.forEach((it) => {
      map.set(it.id, { price: String(it.price), durationMin: String(it.durationMin) });
    });
    return map;
  }, [data]);

  const [edits, setEdits] = useState<Map<string, EditState>>(new Map());

  // sincroniza edits si vienen datos nuevos (primera carga / refetch)
  useEffect(() => {
    setEdits(initialEdits);
  }, [initialEdits]);

  function setEdit(id: string, patch: Partial<EditState>) {
    setEdits((prev) => {
      const next = new Map(prev);
      const cur = next.get(id) ?? { price: "", durationMin: "" };
      next.set(id, { ...cur, ...patch });
      return next;
    });
  }

  function isValidNumber(v: string) {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0;
  }

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

  async function handleGuardar(id: string) {
    const v = edits.get(id);
    if (!v) return;

    const priceStr = String(v.price).trim();
    const durationNum = Number(String(v.durationMin).trim());

    if (!priceStr || !isValidNumber(priceStr)) {
      mostrarFeedback({
        title: "Precio inválido",
        message: "Usa un número válido para el precio. Ejemplo: 12000.",
        variant: "error",
      });
      return;
    }

    if (!String(v.durationMin).trim() || Number.isNaN(durationNum) || durationNum <= 0) {
      mostrarFeedback({
        title: "Duración inválida",
        message: "Usa una duración válida en minutos. Ejemplo: 45.",
        variant: "error",
      });
      return;
    }

    try {
      setAccionId(id);

      await actualizarMiServicioBarbero(id, {
        price: Number(priceStr),
        durationMin: durationNum,
      });

      mostrarFeedback({
        title: "Cambios guardados",
        message: "El precio y la duración del servicio fueron actualizados.",
        variant: "success",
      });

      await refetch();
    } catch (e: any) {
      if (e?.status === 401) {
        mostrarFeedback({
          title: "Sesión expirada",
          message: e?.message ?? "Vuelve a iniciar sesión.",
          variant: "error",
        });

        router.push("/barbero/login");
        return;
      }

      mostrarFeedback({
        title: "No se pudo guardar",
        message: e?.message ? String(e.message) : "No se pudieron guardar los cambios.",
        variant: "error",
      });
    } finally {
      setAccionId(null);
    }
  }

  function abrirToggleActivo(params: ToggleServicioTarget) {
    setToggleTarget(params);
  }

  function cerrarToggleActivo() {
    if (accionId === toggleTarget?.id) return;
    setToggleTarget(null);
  }

  async function confirmarToggleActivo() {
    if (!toggleTarget) return;

    try {
      setAccionId(toggleTarget.id);

      await actualizarMiServicioBarbero(toggleTarget.id, {
        isActive: toggleTarget.nextActive,
      });

      setToggleTarget(null);

      mostrarFeedback({
        title: toggleTarget.nextActive ? "Servicio activado" : "Servicio desactivado",
        message: toggleTarget.nextActive
          ? "El servicio ahora estará disponible para reservas."
          : "El servicio ya no estará disponible para nuevas reservas.",
        variant: "success",
      });

      await refetch();
    } catch (e: any) {
      if (e?.status === 401) {
        mostrarFeedback({
          title: "Sesión expirada",
          message: e?.message ?? "Vuelve a iniciar sesión.",
          variant: "error",
        });

        router.push("/barbero/login");
        return;
      }

      mostrarFeedback({
        title: "No se pudo actualizar",
        message: e?.message ? String(e.message) : "No se pudo actualizar el estado del servicio.",
        variant: "error",
      });
    } finally {
      setAccionId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Mis servicios</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Edita tu precio y duración. También puedes activar/desactivar servicios (solo para ti).
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          Cargando servicios...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="hidden md:block">
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
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-neutral-500">
                      Aún no tienes servicios asignados. Pídele al admin que te asigne servicios.
                    </td>
                  </tr>
                ) : (
                  data.map((it) => {
                    const edit = edits.get(it.id) ?? {
                      price: String(it.price),
                      durationMin: String(it.durationMin),
                    };
                    const busy = accionId === it.id;

                    return (
                      <tr key={it.id} className="border-t border-neutral-100">
                        <td className="px-4 py-3">
                          <div className="font-medium text-black">{it.service.name}</div>
                          {it.service.description ? (
                            <div className="text-xs text-neutral-500">{it.service.description}</div>
                          ) : null}
                        </td>

                        <td className="px-4 py-3">
                          <input
                            value={edit.price}
                            onChange={(e) => setEdit(it.id, { price: e.target.value })}
                            className="w-32 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
                            inputMode="numeric"
                            disabled={busy}
                          />
                          <div className="mt-1 text-xs text-neutral-500">
                            CLP: {formatCLP(edit.price)}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <input
                            value={edit.durationMin}
                            onChange={(e) => setEdit(it.id, { durationMin: e.target.value })}
                            className="w-28 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
                            inputMode="numeric"
                            disabled={busy}
                          />
                          <div className="mt-1 text-xs text-neutral-500">min</div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
                              it.isActive
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                                : "border-red-500/30 bg-red-500/10 text-red-700"
                            }`}
                          >
                            {it.isActive ? "ACTIVO" : "INACTIVO"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => void handleGuardar(it.id)}
                              disabled={busy}
                              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-black hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {busy ? "Guardando..." : "Guardar"}
                            </button>

                            <button
                              onClick={() =>
                                abrirToggleActivo({
                                  id: it.id,
                                  name: it.service.name,
                                  nextActive: !it.isActive,
                                })
                              }
                              disabled={busy}
                              className={[
                                "rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                                it.isActive
                                  ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
                                  : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50",
                              ].join(" ")}
                            >
                              {it.isActive ? "Desactivar" : "Activar"}
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
          <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
            {data.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                Aún no tienes servicios asignados. Pídele al admin que te asigne servicios.
              </div>
            ) : (
              data.map((it) => {
                const edit = edits.get(it.id) ?? {
                  price: String(it.price),
                  durationMin: String(it.durationMin),
                };
                const busy = accionId === it.id;

                return (
                  <div key={it.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-black">{it.service.name}</p>
                        {it.service.description ? (
                          <p className="text-xs text-neutral-500">{it.service.description}</p>
                        ) : null}
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${
                          it.isActive
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                            : "border-red-500/30 bg-red-500/10 text-red-700"
                        }`}
                      >
                        {it.isActive ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-neutral-600">Precio</p>
                        <input
                          value={edit.price}
                          onChange={(e) => setEdit(it.id, { price: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
                          inputMode="numeric"
                          disabled={busy}
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-neutral-600">Duración (min)</p>
                        <input
                          value={edit.durationMin}
                          onChange={(e) => setEdit(it.id, { durationMin: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
                          inputMode="numeric"
                          disabled={busy}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => void handleGuardar(it.id)}
                        disabled={busy}
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black hover:bg-neutral-50 disabled:opacity-50"
                      >
                        {busy ? "Guardando..." : "Guardar"}
                      </button>

                      <button
                        onClick={() =>
                          abrirToggleActivo({
                            id: it.id,
                            name: it.service.name,
                            nextActive: !it.isActive,
                          })
                        }
                        disabled={busy}
                        className={[
                          "w-full rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                          it.isActive
                            ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
                            : "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50",
                        ].join(" ")}
                      >
                        {it.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.nextActive ? "Activar servicio" : "Desactivar servicio"}
        message={
          toggleTarget
            ? toggleTarget.nextActive
              ? `¿Seguro que quieres activar el servicio "${toggleTarget.name}"? Este servicio volverá a estar disponible para reservas.`
              : `¿Seguro que quieres desactivar el servicio "${toggleTarget.name}"? No estará disponible para nuevas reservas.`
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
        onConfirm={() => void confirmarToggleActivo()}
        onClose={cerrarToggleActivo}
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
