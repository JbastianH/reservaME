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
    <section className="mt-0">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">{titulo}</h2>

        {resenas.length > 0 ? (
          <div className="shrink-0 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm">
            ⭐ {promedio.toFixed(1)} · {resenas.length} reseña
            {resenas.length > 1 ? "s" : ""}
          </div>
        ) : (
          <div className="shrink-0 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/70 shadow-sm backdrop-blur-sm">
            Sin reseñas
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {resenas.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            Aún no hay reseñas para este profesional.
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

                <span className="shrink-0 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700 shadow-sm">
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
