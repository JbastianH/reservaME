import Link from "next/link";
import { headers } from "next/headers";
import { obtenerResumenReservaPublica } from "@/services/reservas-publicas.service";
import PoliticaCancelacion from "@/componentes/publico/PoliticaCancelacion";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";
import { obtenerVariableFuente } from "@/lib/fuentes-css";
import Reveal from "@/componentes/animaciones/Reveal";

function formatCLP(n: number) {
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(n);
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

  const tenant = await obtenerTenantPublico(tenantHost);

  const settings = tenant.settings;
  const backgroundColor = settings.primaryColor || "#000000";
  const secondaryColor = settings.secondaryColor || "#ffffff";
  const fontFamilyTenant = obtenerVariableFuente(settings.fontFamily);

  if (!id) {
    return (
      <main
        className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-10 font-sans"
        style={{ backgroundColor }}
      >
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${secondaryColor}25` }}
        />

        <Reveal delay={0.1} direction="up">
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border p-6 text-center shadow-2xl backdrop-blur-sm sm:p-8"
            style={{
              background: "linear-gradient(135deg, rgba(10,10,10,0.92), rgba(38,38,38,0.86))",
              borderColor: `${secondaryColor}55`,
            }}
          >
            <div
              className="mx-auto mb-6 h-1 w-24 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />

            <p
              className="mb-2 text-xs font-semibold tracking-[0.35em] uppercase"
              style={{
                color: secondaryColor,
                fontFamily: fontFamilyTenant,
              }}
            >
              Resumen de reserva
            </p>

            <h1 className="text-2xl font-semibold text-white">Falta el id de la reserva</h1>

            <p className="mt-3 text-sm text-white/60">
              No se pudo encontrar la información necesaria para mostrar el resumen.
            </p>

            <Link
              className="mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-semibold text-black transition hover:opacity-85"
              href="/"
              style={{ backgroundColor: secondaryColor }}
            >
              Volver al inicio
            </Link>
          </div>
        </Reveal>
      </main>
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
    <main
      className="relative min-h-[calc(100vh-8rem)] overflow-hidden px-4 py-10 font-sans"
      style={{ backgroundColor }}
    >
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: `${secondaryColor}25` }}
      />

      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: `${secondaryColor}18` }}
      />

      <Reveal delay={0.1} direction="up">
        <div className="relative mx-auto w-full max-w-2xl">
          <div
            className="relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm sm:p-8"
            style={{
              background: "linear-gradient(135deg, rgba(10,10,10,0.92), rgba(38,38,38,0.86))",
              borderColor: `${secondaryColor}55`,
            }}
          >
            <div
              className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl"
              style={{ backgroundColor: `${secondaryColor}33` }}
            />

            <div
              className="relative mb-6 h-1 w-24 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />

            <div className="relative">
              <p
                className="text-xs font-semibold tracking-[0.35em] uppercase"
                style={{
                  color: secondaryColor,
                  fontFamily: fontFamilyTenant,
                }}
              >
                Resumen de reserva
              </p>

              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                ¡Reserva confirmada!
              </h1>

              <p className="mt-2 text-sm text-white/60">Revisa los detalles de tu hora agendada.</p>

              <div
                className="mt-8 rounded-[1.5rem] border bg-white/10 p-5 shadow-xl backdrop-blur-sm"
                style={{ borderColor: `${secondaryColor}33` }}
              >
                <div className="space-y-4 text-sm text-white/80">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/50">Barbero</span>
                    <span className="text-right font-medium text-white">{r.barber.name}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/50">Servicio</span>
                    <span className="text-right font-medium text-white">{r.service.name}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/50">Fecha</span>
                    <span className="text-right font-medium text-white">
                      {start.toLocaleDateString("es-CL")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/50">Hora</span>
                    <span className="text-right font-medium text-white">
                      {start.toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {end.toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/50">Duración</span>
                    <span className="text-right font-medium text-white">
                      {r.durationFinalMin} min
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/50">Precio</span>
                    <span
                      className="rounded-full px-3 py-1 text-right text-sm font-semibold text-black"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      {formatCLP(Number(r.priceFinal))}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="mt-6 rounded-[1.5rem] border bg-white/10 p-5 shadow-xl backdrop-blur-sm"
                style={{ borderColor: `${secondaryColor}33` }}
              >
                <p className="font-semibold text-white">Datos del cliente</p>

                <div className="mt-4 space-y-2 text-sm text-white/75">
                  <p>
                    <span className="text-white/45">Nombre:</span> {r.clientName}
                  </p>

                  <p>
                    <span className="text-white/45">Teléfono:</span> {r.clientPhone}
                  </p>

                  <p>
                    <span className="text-white/45">Email:</span> {r.clientEmail}
                  </p>
                </div>

                {commentSafe ? (
                  <div className="pt-5">
                    <p className="font-semibold text-white">Comentario</p>

                    <p
                      className="mt-2 rounded-xl border bg-black/30 p-3 text-sm whitespace-pre-wrap text-white/75"
                      style={{ borderColor: `${secondaryColor}33` }}
                    >
                      {commentSafe}
                    </p>
                  </div>
                ) : null}
              </div>

              <div
                className="mt-6 rounded-[1.5rem] border bg-white/10 p-5 shadow-xl backdrop-blur-sm"
                style={{ borderColor: `${secondaryColor}33` }}
              >
                <PoliticaCancelacion
                  soloLectura={true}
                  secondaryColor={secondaryColor}
                  darkMode={true}
                  cancellationHoursBefore={tenant.settings.cancellationHoursBefore ?? 3}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/barberos/${encodeURIComponent(r.barber.slug)}`}
                  className="rounded-xl border bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                  style={{ borderColor: `${secondaryColor}55` }}
                >
                  Volver al perfil del barbero
                </Link>

                <Link
                  href="/"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-black transition hover:opacity-85"
                  style={{ backgroundColor: secondaryColor }}
                >
                  Ir al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
