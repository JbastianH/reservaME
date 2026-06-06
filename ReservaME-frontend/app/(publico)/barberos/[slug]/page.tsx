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

  const barber = await obtenerBarberoPublico(slug, tenantHost);
  const servicios = await listarServiciosDeBarberoPublico(slug, tenantHost);
  const resenas = await listarResenasPorBarberoPublico(slug, tenantHost);

  const imgSrc = safeImageSrc(barber.photoUrl);
  const ini = initials(barber.name);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      {/* ===== Header Barbero ===== */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        {/* en mobile la foto queda arriba a la derecha */}
        <div className="grid gap-6 md:grid-cols-[1fr_140px] md:items-center">
          {/* INFO IZQUIERDA */}
          <div className="min-w-0">
            {/* título + teléfono + foto arriba derecha */}
            <div className="flex items-start justify-between gap-4 md:hidden">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold text-black">{barber.name}</h1>

                {barber.phone ? (
                  <a
                    href={`tel:${barber.phone}`}
                    className="mt-2 inline-flex text-sm font-medium text-black underline underline-offset-4 hover:text-neutral-700"
                  >
                    {barber.phone}
                  </a>
                ) : null}
              </div>

              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 shadow-sm ring-4 ring-white">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={barber.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-base font-semibold text-neutral-700">
                    {ini || "B"}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop/Tablet: título y teléfono normales (foto va a la derecha) */}
            <div className="hidden md:block">
              <h1 className="text-2xl font-semibold text-black">{barber.name}</h1>

              {barber.phone ? (
                <a
                  href={`tel:${barber.phone}`}
                  className="mt-2 inline-flex text-sm font-medium text-black underline underline-offset-4 hover:text-neutral-700"
                >
                  {barber.phone}
                </a>
              ) : null}
            </div>

            {/* Bio */}
            {barber.bio ? (
              <p className="mt-4 text-neutral-700">{barber.bio}</p>
            ) : (
              <p className="mt-4 text-neutral-500">Barbero profesional</p>
            )}

            {/* Chips para que no se vea vacío */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700">
                Servicios disponibles: {servicios.length}
              </span>
              <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700">
                Atención con reserva
              </span>
            </div>
          </div>

          {/* FOTO DERECHA (solo md+) */}
          <div className="hidden justify-start md:flex md:justify-end">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 shadow-sm ring-4 ring-white">
              {imgSrc ? (
                <Image src={imgSrc} alt={barber.name} fill sizes="112px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-700">
                  {ini || "B"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Servicios ===== */}
      <h2 className="mt-10 text-lg font-semibold text-white">Servicios</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {servicios.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
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
                    className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                  />
                }
              />
            );
          })
        )}
      </div>

      {/* ===== Portafolio ===== */}
      <div className="mt-12">
        <PortafolioPublico
          fotos={barber.portfolioImages.map((x) => ({ id: x.id, imageUrl: x.imageUrl }))}
          titulo="Trabajos"
        />
      </div>

      {/* ===== Reseñas ===== */}
      <ResenasPublicas resenas={resenas} />
    </div>
  );
}
