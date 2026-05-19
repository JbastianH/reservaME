import type { PublicResenaItem } from "@/services/resenas-publicas.service";

function estrellas(n: number) {
  const r = Math.max(1, Math.min(5, n));
  return "★★★★★☆☆☆☆☆".slice(5 - r, 10 - r);
}

function inicialCliente(nombre: string) {
  const p = nombre.trim().split(/\s+/);
  if (p.length === 0) return "Cliente";
  const first = p[0] ?? "Cliente";
  const lastInitial = p.length > 1 ? ` ${p[p.length - 1][0]?.toUpperCase()}.` : "";
  return `${first}${lastInitial}`;
}

export default function ResenasPublicas({
  resenas,
  titulo = "Reseñas",
}: {
  resenas: PublicResenaItem[];
  titulo?: string;
}) {
  const total = resenas.length;

  const promedio = total > 0 ? resenas.reduce((acc, r) => acc + r.rating, 0) / total : 0;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">{titulo}</h2>

        {resenas.length > 0 ? (
          <p className="text-sm text-neutral-500">
            ⭐ {promedio.toFixed(1)} · {resenas.length} reseña
            {resenas.length > 1 ? "s" : ""}
          </p>
        ) : (
          <p className="text-sm text-neutral-500">Sin reseñas</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {resenas.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            Aún no hay reseñas para este barbero.
          </div>
        ) : (
          resenas.map((r) => (
            <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-black">
                    {inicialCliente(r.reservation.clientName)}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {r.reservation.service?.name ?? "Servicio"}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700">
                  {estrellas(r.rating)}
                </span>
              </div>

              {r.comment ? (
                <p className="mt-3 text-sm text-neutral-700">{r.comment}</p>
              ) : (
                <p className="mt-3 text-sm text-neutral-400">Sin comentario</p>
              )}

              <p className="mt-3 text-xs text-neutral-500">
                {new Date(r.createdAt).toLocaleDateString("es-CL")}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
