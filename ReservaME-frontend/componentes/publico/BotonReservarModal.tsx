"use client";

import { useState } from "react";
import ReservaModal from "@/componentes/publico/ReservaModal";

type Mode = "CREAR" | "REPROGRAMAR";
type ReprogramarActor = "BARBERO" | "ADMIN";

type Props = {
  barberId: string;
  barberSlug: string;
  barberName: string;

  barberServiceId: string;
  serviceName: string;
  durationMin: number;

  className?: string;

  mode?: Mode; // default "CREAR"
  reservaId?: string; // requerido si mode === "REPROGRAMAR"
  actor?: ReprogramarActor; // default "BARBERO"
  initialDate?: string; // YYYY-MM-DD (opcional)
  label?: string; // texto del botón

  // para que el padre (panel) haga refresh de la lista sin recargar
  onSuccess?: (info: { mensaje: string; startAtIso: string }) => void;
};

export default function BotonReservarModal(props: Props) {
  const [open, setOpen] = useState(false);

  const mode = props.mode ?? "CREAR";

  function abrir() {
    // guardrail por si se usa mal
    if (mode === "REPROGRAMAR" && !props.reservaId) {
      alert("Falta reservaId para reprogramar.");
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className={
          props.className ??
          "inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        }
      >
        {props.label ?? (mode === "CREAR" ? "Reservar" : "Reprogramar")}
      </button>

      <ReservaModal
        open={open}
        onClose={() => setOpen(false)}
        barberId={props.barberId}
        barberSlug={props.barberSlug}
        barberName={props.barberName}
        barberServiceId={props.barberServiceId}
        serviceName={props.serviceName}
        durationMin={props.durationMin}
        mode={mode}
        reservaId={props.reservaId}
        actor={props.actor}
        initialDate={props.initialDate}
        onSuccess={props.onSuccess}
      />
    </>
  );
}