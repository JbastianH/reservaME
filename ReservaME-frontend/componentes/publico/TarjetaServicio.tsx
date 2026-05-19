"use client";

type Props = {
  name: string;
  description?: string | null;
  durationMin?: number | null;
  price?: number | string | null; // viene string si tu API devuelve Decimal
  isActive?: boolean | null;

  onClick?: () => void; // si quieres que sea clickable
  footerSlot?: React.ReactNode; // botón “Reservar”, etc.
};

function toNumber(v: number | string | null | undefined) {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function TarjetaServicio({
  name,
  description,
  durationMin,
  price,
  isActive = true,
  onClick,
  footerSlot,
}: Props) {
  const precio = toNumber(price);
  const clickable = typeof onClick === "function";

  return (
    <div
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={[
        "rounded-2xl border bg-white p-4 shadow-sm",
        "border-neutral-200",
        clickable ? "cursor-pointer transition hover:border-neutral-300 hover:shadow" : "",
        !isActive ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-black">{name}</p>

          {description ? (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-700">{description}</p>
          ) : (
            <p className="mt-1 text-sm text-neutral-500">—</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
            {typeof durationMin === "number" ? (
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1">
                ⏱ {durationMin} min
              </span>
            ) : null}

            {precio !== null ? (
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1">
                💲{precio.toLocaleString("es-CL")}
              </span>
            ) : null}

            <span
              className={[
                "rounded-full border px-2 py-1",
                isActive
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                  : "border-neutral-400/40 bg-neutral-200/40 text-neutral-700",
              ].join(" ")}
            >
              {isActive ? "ACTIVO" : "INACTIVO"}
            </span>
          </div>
        </div>
      </div>

      {footerSlot ? <div className="mt-4">{footerSlot}</div> : null}
    </div>
  );
}