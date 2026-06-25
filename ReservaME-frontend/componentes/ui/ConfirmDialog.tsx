"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "default" | "danger" | "warning";
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  variant = "default",
  onConfirm,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const accentColor =
    variant === "danger" ? "#dc2626" : variant === "warning" ? "#eab308" : "#ffffff";

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : variant === "warning"
        ? "bg-yellow-500 text-black hover:bg-yellow-400"
        : "bg-white text-black hover:bg-neutral-200";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-[2rem] border bg-neutral-950 p-6 text-center shadow-2xl"
        style={{ borderColor: `${accentColor}66` }}
      >
        <div
          className="mx-auto mb-5 h-1 w-20 rounded-full"
          style={{ backgroundColor: accentColor }}
        />

        <h2 className="text-xl font-bold text-white">{title}</h2>

        <p className="mt-3 text-sm leading-6 text-white/60">{message}</p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
