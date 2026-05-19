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
};

export default function CarruselBarberosSwiper({ barberos }: Props) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <section className="bg-black py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="caprasimo-regular text-3xl font-semibold text-white">Nuestros barberos</h2>
            <p className="milonga-regular mt-1 text-lg text-white/70">Desliza para ver más →</p>
          </div>

          <div className="flex gap-2">
            <button
              ref={prevRef}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Anterior"
            >
              ←
            </button>
            <button
              ref={nextRef}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Siguiente"
            >
              →
            </button>
          </div>
        </div>

        <Swiper
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
            // Swiper necesita que le inyectemos los refs cuando ya existen
            // @ts-expect-error - Swiper types no exponen bien esto
            swiper.params.navigation.prevEl = prevRef.current;
            // @ts-expect-error
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          breakpoints={{
            640: { slidesPerView: 2.1 },
            1024: { slidesPerView: 3.1 },
          }}
        >
          {barberos.map((b) => (
            <SwiperSlide key={b.id}>
              <TarjetaBarbero
                name={b.name}
                slug={b.slug}
                bio={b.bio}
                photoUrl={b.photoUrl}
                href={`/barberos/${b.slug}`}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}