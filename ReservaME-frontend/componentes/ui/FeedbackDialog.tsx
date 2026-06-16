"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title: string;
  message: string;
  variant?: "success" | "error" | "info";
  onClose: () => void;
};

export default function FeedbackDialog({ open, title, message, variant = "info", onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const accentColor =
    variant === "success" ? "#22c55e" : variant === "error" ? "#dc2626" : "#ffffff";

  const icon = variant === "success" ? "✓" : variant === "error" ? "!" : "i";

  const iconClass =
    variant === "success" ? "text-black" : variant === "error" ? "text-white" : "text-black";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-[2rem] border bg-neutral-950 p-6 text-center shadow-2xl"
        style={{ borderColor: `${accentColor}66` }}
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold"
          style={{ backgroundColor: accentColor }}
        >
          <span className={iconClass}>{icon}</span>
        </div>

        <h2 className="mt-5 text-xl font-bold text-white">{title}</h2>

        <p className="mt-3 text-sm leading-6 text-white/60">{message}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-85"
          style={{
            backgroundColor: accentColor,
            color: variant === "error" ? "#ffffff" : "#000000",
          }}
        >
          Entendido
        </button>
      </div>
    </div>,
    document.body,
  );
}
