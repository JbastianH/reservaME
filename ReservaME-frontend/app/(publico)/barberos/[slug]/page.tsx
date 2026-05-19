import Link from "next/link";
import Image from "next/image";
import {
  obtenerBarberoPublico,
  listarServiciosDeBarberoPublico,
} from "@/services/barberos.service";
import PortafolioPublico from "@/componentes/publico/PortafolioPublico";
import { listarResenasPorBarberoPublico } from "@/services/resenas-publicas.service";

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
  const { slug } = await params;

  const barber = await obtenerBarberoPublico(slug);
  // Nota: servicios ya no se usan para el modal, pero podrías listarlos como info estática si quisieras
  const resenas = await listarResenasPorBarberoPublico(slug);

  const imgSrc = safeImageSrc(barber.photoUrl);
  const ini = initials(barber.name);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 pb-24 md:pb-10">
      {/* ===== Header Barbero ===== */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[1fr_140px] md:items-center">
          {/* INFO IZQUIERDA */}
          <div className="brand-title min-w-0">
            {/* Título + Teléfono + Foto (Mobile) */}
            <div className="flex items-start justify-between gap-4 md:hidden">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold text-black">{barber.name}</h1>
                {barber.phone && (
                  <a
                    href={`tel:${barber.phone}`}
                    className="mt-1 inline-flex text-sm text-neutral-500 underline underline-offset-4 hover:text-black"
                  >
                    {barber.phone}
                  </a>
                )}
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

            {/* Desktop: Título y Teléfono */}
            <div className="hidden md:block">
              <h1 className="text-3xl font-semibold text-black">{barber.name}</h1>
              {barber.phone && (
                <a
                  href={`tel:${barber.phone}`}
                  className="mt-1 inline-flex text-base text-neutral-500 underline underline-offset-4 hover:text-black"
                >
                  {barber.phone}
                </a>
              )}
            </div>

            {/* Bio */}
            {barber.bio ? (
              <p className="mt-3 text-lg text-neutral-500">{barber.bio}</p>
            ) : (
              <p className="mt-3 text-lg text-neutral-400">Barbero profesional</p>
            )}

            {/* BOTÓN RESERVAR (Desktop) */}
            <div className="mt-6 hidden md:block">
              <a
                href={barber.linkSetmore}
                target="_blank"
                rel="noopener noreferrer"
                className="milonga-regular inline-flex items-center justify-center rounded-xl bg-black px-8 py-3 text-sm font-bold text-white shadow-lg shadow-neutral-200 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                RESERVAR AHORA
              </a>
            </div>

            {/* Chip informativo */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="caprasimo-regular inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                Reserva externa
              </span>
            </div>
          </div>

          {/* FOTO DERECHA (Desktop) */}
          <div className="hidden justify-end md:flex">
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

      {/* ===== BOTÓN RESERVAR (Sticky Mobile) ===== */}
      {/* Solo se ve en mobile y queda pegado abajo */}
      <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-neutral-100 bg-white/80 p-4 backdrop-blur-md md:hidden">
        <a
          href={barber.linkSetmore}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-xl bg-black py-4 text-center text-sm font-bold text-white shadow-xl"
        >
          RESERVAR CITA
        </a>
      </div>

      {/* ===== Portafolio ===== */}
      <div className="caprasimo-regular mt-12">
        <PortafolioPublico
          fotos={barber.portfolioImages.map((x) => ({ id: x.id, imageUrl: x.imageUrl }))}
          titulo="Portafolio de Trabajos"
        />
      </div>

      {/* Podrías agregar las reseñas aquí abajo también */}
    </div>
  );
}
