"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import TarjetaBarbero from "./TarjetaBarbero";

type Barbero = {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  photoUrl?: string | null;
};

type Props = {
  barberos: Barbero[];
  secondaryColor?: string;
};

export default function CarruselBarberosSwiper({ barberos, secondaryColor = "#ffffff" }: Props) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div
          className="relative overflow-hidden rounded-[2.5rem] border p-6 shadow-2xl backdrop-blur-sm sm:p-8"
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
          <div className="mb-6 h-1 w-28 rounded-full" style={{ backgroundColor: secondaryColor }} />

          <div className="relative mb-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="caprasimo-regular text-3xl font-semibold text-white">
                Nuestros Trabajadores
              </h2>

              <p className="caprasimo-regular mt-1 text-lg text-white/70">Desliza para ver más →</p>
            </div>

            <div className="flex gap-2">
              <button
                ref={prevRef}
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Anterior"
              >
                ←
              </button>

              <button
                ref={nextRef}
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Siguiente"
              >
                →
              </button>
            </div>
          </div>

          <div className="relative">
            <Swiper
              className="!overflow-visible px-1 py-5"
              modules={[Navigation, Autoplay]}
              spaceBetween={16}
              slidesPerView={1.1}
              centeredSlides={false}
              grabCursor
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              onBeforeInit={(swiper) => {
                // @ts-expect-error Swiper permite asignar referencias después de inicializar los refs.
                swiper.params.navigation.prevEl = prevRef.current;

                // @ts-expect-error Swiper permite asignar referencias después de inicializar los refs.
                swiper.params.navigation.nextEl = nextRef.current;
              }}
              breakpoints={{
                640: { slidesPerView: 2.1 },
                1024: { slidesPerView: 3.1 },
              }}
            >
              {barberos.map((b) => (
                <SwiperSlide key={b.id} className="h-auto py-2">
                  <TarjetaBarbero
                    name={b.name}
                    slug={b.slug}
                    bio={b.bio}
                    photoUrl={b.photoUrl}
                    href={`/barberos/${b.slug}`}
                    secondaryColor={secondaryColor}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
