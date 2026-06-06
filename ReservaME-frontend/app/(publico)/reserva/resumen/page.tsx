import Link from "next/link";
import { obtenerResumenReservaPublica } from "@/services/reservas-publicas.service";
import PoliticaCancelacion from "@/componentes/publico/PoliticaCancelacion";
import { headers } from "next/headers";

function formatCLP(n: number) {
  try {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
  } catch {
    return `$${n}`;
  }
}

export default async function ReservaResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const sp = await searchParams;
  const id = (sp.id ?? "").trim();

  const requestHeaders = await headers();
  const tenantHost = requestHeaders.get("host");

  if (!id) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Falta el id de la reserva.
        </div>
        <Link className="mt-4 inline-flex text-sm underline" href="/">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const r = await obtenerResumenReservaPublica(id, tenantHost);

  const start = new Date(r.startAt);
  const end = new Date(r.endAt);

  const commentSafe =
    typeof (r as any).comment === "string" && (r as any).comment.trim()
      ? (r as any).comment.trim()
      : "";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium text-neutral-500">Resumen de reserva</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">¡Reserva confirmada!</h1>

        <div className="mt-6 space-y-3 text-sm text-neutral-800">
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Barbero</span>
            <span className="font-medium">{r.barber.name}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Servicio</span>
            <span className="font-medium">{r.service.name}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Fecha</span>
            <span className="font-medium">{start.toLocaleDateString("es-CL")}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Hora</span>
            <span className="font-medium">
              {start.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} –{" "}
              {end.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Duración</span>
            <span className="font-medium">{r.durationFinalMin} min</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Precio</span>
            <span className="font-semibold text-black">{formatCLP(Number(r.priceFinal))}</span>
          </div>
        </div>

        <hr className="my-6 border-neutral-200" />

        <div className="space-y-2 text-sm text-neutral-800">
          <p className="font-semibold text-black">Datos del cliente</p>
          <p>
            <span className="text-neutral-500">Nombre:</span> {r.clientName}
          </p>
          <p>
            <span className="text-neutral-500">Teléfono:</span> {r.clientPhone}
          </p>
          <p>
            <span className="text-neutral-500">Email:</span> {r.clientEmail}
          </p>

          {commentSafe ? (
            <div className="pt-2">
              <p className="font-semibold text-black">Comentario</p>
              <p className="mt-1 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm whitespace-pre-wrap text-neutral-800">
                {commentSafe}
              </p>
            </div>
          ) : null}
          <div className="mt-6">
            <PoliticaCancelacion soloLectura={true} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/barberos/${encodeURIComponent(r.barber.slug)}`}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-black hover:bg-neutral-50"
          >
            Volver al perfil del barbero
          </Link>

          <Link
            href="/"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
