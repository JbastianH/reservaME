"use client";

type Props = {
  open: boolean;
  title: string;
  message: string;
  variant?: "success" | "error" | "info";
  onClose: () => void;
};

export default function FeedbackDialog({
  open,
  title,
  message,
  variant = "info",
  onClose,
}: Props) {
  if (!open) return null;

  const colorClass =
    variant === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : variant === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-neutral-200 bg-neutral-50 text-neutral-700";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className={`rounded-2xl border p-4 ${colorClass}`}>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-2 text-sm leading-6">{message}</p>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}