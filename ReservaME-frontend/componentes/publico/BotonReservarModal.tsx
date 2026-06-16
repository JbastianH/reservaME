"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
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
  cancellationHoursBefore?: number;

  className?: string;
  style?: CSSProperties;

  mode?: Mode;
  reservaId?: string;
  actor?: ReprogramarActor;
  initialDate?: string;
  label?: string;

  onSuccess?: (info: { mensaje: string; startAtIso: string }) => void;
};

export default function BotonReservarModal(props: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const mode = props.mode ?? "CREAR";

  useEffect(() => {
    setMounted(true);
  }, []);

  function abrir() {
    if (mode === "REPROGRAMAR" && !props.reservaId) {
      alert("Falta reservaId para reprogramar.");
      return;
    }

    setOpen(true);
  }

  const modal = (
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
      cancellationHoursBefore={props.cancellationHoursBefore}
    />
  );

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        style={props.style}
        className={
          props.className ??
          "inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        }
      >
        {props.label ?? (mode === "CREAR" ? "Reservar" : "Reprogramar")}
      </button>

      {mounted ? createPortal(modal, document.body) : null}
    </>
  );
}
