import { headers } from "next/headers";
import Image from "next/image";
import TarjetaServicio from "@/componentes/publico/TarjetaServicio";
import {
  obtenerBarberoPublico,
  listarServiciosDeBarberoPublico,
} from "@/services/barberos.service";
import PortafolioPublico from "@/componentes/publico/PortafolioPublico";
import ResenasPublicas from "@/componentes/publico/ResenasPublicas";
import { listarResenasPorBarberoPublico } from "@/services/resenas-publicas.service";
import BotonReservarModal from "@/componentes/publico/BotonReservarModal";
import Reveal from "@/componentes/animaciones/Reveal";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";
import { obtenerVariableFuente } from "@/lib/fuentes-css";

/* Helpers */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function safeImageSrc(src?: string | null) {
  const s = (src ?? "").trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  return null;
}

export default async function BarberoPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const requestHeaders = await headers();
  const tenantHost = requestHeaders.get("host");
  const { slug } = await params;

  const [tenant, barber, servicios, resenas] = await Promise.all([
    obtenerTenantPublico(tenantHost),
    obtenerBarberoPublico(slug, tenantHost),
    listarServiciosDeBarberoPublico(slug, tenantHost),
    listarResenasPorBarberoPublico(slug, tenantHost),
  ]);

  const settings = tenant.settings;

  const backgroundColor = settings.primaryColor || "#000000";
  const secondaryColor = settings.secondaryColor || "#ffffff";
  const fontFamily = obtenerVariableFuente(settings.fontFamily);

  const imgSrc = safeImageSrc(barber.photoUrl);
  const ini = initials(barber.name);

  const trabajos = barber.portfolioImages.map((x) => ({
    id: x.id,
    imageUrl: x.imageUrl,
  }));

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor,
        fontFamily,
      }}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        {/* ===== Header Barbero ===== */}
        <Reveal delay={0.1} direction="left">
          <div
            className="relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm"
            style={{
              background: "linear-gradient(135deg, rgba(10,10,10,0.92), rgba(38,38,38,0.86))",
              borderColor: `${secondaryColor}55`,
            }}
          >
            {/* Brillo decorativo */}
            <div
              className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl"
              style={{ backgroundColor: `${secondaryColor}33` }}
            />

            {/* Línea superior decorativa */}
            <div
              className="mb-6 h-1 w-24 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />

            <div className="relative grid gap-6 md:grid-cols-[1fr_140px] md:items-center">
              {/* INFO IZQUIERDA */}
              <div className="min-w-0">
                {/* título + teléfono + foto arriba derecha */}
                <div className="flex items-start justify-between gap-4 md:hidden">
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-semibold text-white">{barber.name}</h1>

                    {barber.phone ? (
                      <a
                        href={`tel:${barber.phone}`}
                        className="mt-2 inline-flex text-sm font-medium underline underline-offset-4 transition hover:opacity-80"
                      >
                        {barber.phone}
                      </a>
                    ) : null}
                  </div>

                  <div
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-neutral-50 shadow-sm ring-4 ring-white/10"
                    style={{ borderColor: `${secondaryColor}66` }}
                  >
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={barber.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-base font-semibold"
                        style={{ color: secondaryColor }}
                      >
                        {ini || "B"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop/Tablet: título y teléfono normales */}
                <div className="hidden md:block">
                  <h1 className="text-3xl font-semibold text-white">{barber.name}</h1>

                  {barber.phone ? (
                    <a
                      href={`tel:${barber.phone}`}
                      className="mt-2 inline-flex text-sm font-medium underline underline-offset-4 transition hover:opacity-80"
                    >
                      {barber.phone}
                    </a>
                  ) : null}
                </div>

                {/* Bio */}
                {barber.bio ? (
                  <p className="mt-4 text-white/70">{barber.bio}</p>
                ) : (
                  <p className="mt-4 text-white/60">Barbero profesional</p>
                )}

                {/* Chips */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className="inline-flex rounded-full border bg-white/10 px-3 py-1 text-xs text-white/80"
                    style={{ borderColor: `${secondaryColor}55` }}
                  >
                    Servicios disponibles: {servicios.length}
                  </span>

                  <span
                    className="inline-flex rounded-full border bg-white/10 px-3 py-1 text-xs text-white/80"
                    style={{ borderColor: `${secondaryColor}55` }}
                  >
                    Atención con reserva
                  </span>
                </div>
              </div>

              {/* FOTO DERECHA solo md+ */}
              <div className="hidden justify-start md:flex md:justify-end">
                <div
                  className="relative h-28 w-28 overflow-hidden rounded-full border bg-neutral-50 shadow-sm ring-4 ring-white/10"
                  style={{ borderColor: `${secondaryColor}66` }}
                >
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={barber.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-lg font-semibold"
                      style={{ color: secondaryColor }}
                    >
                      {ini || "B"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ===== Servicios ===== */}
        <Reveal delay={0.15} direction="right">
          <section
            className="relative mt-10 overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm"
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
              className="mb-6 h-1 w-24 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />

            <div className="relative">
              <h2 className="text-2xl font-semibold text-white">Servicios</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {servicios.length === 0 ? (
                  <div
                    className="rounded-2xl border bg-white/10 p-4 text-sm text-white/70"
                    style={{ borderColor: `${secondaryColor}55` }}
                  >
                    Este barbero aún no tiene servicios disponibles.
                  </div>
                ) : (
                  servicios.map((x) => {
                    const s = x.service;
                    const precio = Number(x.price);

                    return (
                      <TarjetaServicio
                        key={x.id}
                        name={s.name}
                        description={s.description ?? undefined}
                        durationMin={x.durationMin}
                        price={Number.isFinite(precio) ? precio : 0}
                        isActive={x.isActive}
                        footerSlot={
                          <BotonReservarModal
                            barberId={barber.id}
                            barberSlug={barber.slug}
                            barberName={barber.name}
                            barberServiceId={x.id}
                            serviceName={s.name}
                            durationMin={x.durationMin}
                            cancellationHoursBefore={tenant.settings.cancellationHoursBefore ?? 3}
                            className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-85"
                            style={{
                              backgroundColor: secondaryColor,
                            }}
                          />
                        }
                      />
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </Reveal>

        {/* ===== Portafolio ===== */}
        <Reveal delay={0.15} direction="left">
          <section
            className="relative mt-12 overflow-hidden rounded-[2rem] border px-6 pt-4 pb-6 shadow-2xl backdrop-blur-sm"
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
              className="mb-4 h-1 w-24 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />

            <div className="relative">
              {trabajos.length === 0 ? (
                <div
                  className="rounded-2xl border bg-white/10 p-5 text-sm text-white/70"
                  style={{ borderColor: `${secondaryColor}55` }}
                >
                  Este profesional aún no tiene trabajos publicados.
                </div>
              ) : (
                <PortafolioPublico fotos={trabajos} titulo="Trabajos" />
              )}
            </div>
          </section>
        </Reveal>

        {/* ===== Reseñas ===== */}
        <Reveal delay={0.15} direction="right">
          <section
            className="relative mt-12 overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-sm"
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
              className="mb-6 h-1 w-24 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />

            <div className="relative">
              <ResenasPublicas resenas={resenas} />
            </div>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
