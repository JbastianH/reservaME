"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type FeedbackVariant = "success" | "error";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  variant?: FeedbackVariant;
  onClose: () => void;
  autoCloseMs?: number;
};

export default function FeedbackDialog({
  open,
  title,
  message,
  variant = "success",
  onClose,
  autoCloseMs = 2600,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setShouldRender(true);

      const frame = requestAnimationFrame(() => {
        setVisible(true);
      });

      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);

    const timeout = window.setTimeout(() => {
      setShouldRender(false);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timeout = window.setTimeout(() => {
      onClose();
    }, autoCloseMs);

    return () => window.clearTimeout(timeout);
  }, [open, autoCloseMs, onClose]);

  if (!mounted || !shouldRender) return null;

  const isSuccess = variant === "success";

  return createPortal(
    <div className="pointer-events-none fixed top-6 right-4 z-[9999] flex w-[calc(100vw-2rem)] max-w-md justify-end">
      <div
        role="status"
        aria-live="polite"
        className={[
          "pointer-events-auto w-full rounded-2xl border bg-white p-4 shadow-2xl transition-all duration-300",
          visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
          isSuccess ? "border-emerald-200" : "border-red-200",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div
            className={[
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              isSuccess ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
            ].join(" ")}
          >
            {isSuccess ? "✓" : "!"}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={[
                "text-sm font-semibold",
                isSuccess ? "text-emerald-900" : "text-red-900",
              ].join(" ")}
            >
              {title}
            </p>

            {message ? <p className="mt-1 text-sm text-neutral-600">{message}</p> : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
