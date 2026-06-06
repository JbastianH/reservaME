"use client";

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
  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : variant === "warning"
        ? "bg-yellow-500 text-black hover:bg-yellow-400"
        : "bg-neutral-950 text-white hover:bg-neutral-800";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-neutral-950">{title}</h2>

        <p className="mt-3 text-sm leading-6 text-neutral-600">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100 disabled:opacity-50"
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
    </div>
  );
}