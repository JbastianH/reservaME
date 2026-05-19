"use client";

import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import TarjetaProducto from "./TarjetaProducto";
import ProductoDetalleModal from "./ProductoDetalleModal"; // Importamos el nuevo componente

type Producto = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  imagenUrl?: string | null;
};

type Props = {
  productos: Producto[];
};

export default function CarruselProductosSwiper({ productos }: Props) {
  // --- ESTADO PARA LA LÁMINA ---
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  if (!productos || productos.length === 0) {
    return null;
  }

  return (
    <section className="bg-black py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11 0 .308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
              </svg>
              Exclusivo venta en local
            </span>
            
            <div>
              <h2 className="caprasimo-regular text-3xl font-semibold tracking-tight text-white">Nuestra Tienda</h2>
              <p className="milonga-regular mt-1 text-lg text-neutral-400">Productos de alta calidad para mantener tu estilo impecable.</p>
            </div>
          </div>

          <div className="flex gap-2 self-end">
            <button
              ref={prevRef}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              ←
            </button>
            <button
              ref={nextRef}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              →
            </button>
          </div>
        </div>

        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={16}
          slidesPerView={1.2}
          grabCursor
          autoplay={{
            delay: 2000, 
            disableOnInteraction: false, 
          }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onBeforeInit={(swiper) => {
            // @ts-expect-error
            swiper.params.navigation.prevEl = prevRef.current;
            // @ts-expect-error
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          breakpoints={{
            480: { slidesPerView: 2.2 },
            768: { slidesPerView: 3.2 },
            1024: { slidesPerView: 4.2 },
          }}
        >
          {productos.map((producto) => (
            <SwiperSlide key={producto.id} className="h-auto">
              {/* Pasamos la función setSelectedProduct al componente hijo */}
              <div onClick={() => setSelectedProduct(producto)} className="cursor-pointer">
                <TarjetaProducto
                  nombre={producto.nombre}
                  descripcion={producto.descripcion}
                  precio={producto.precio}
                  imagenUrl={producto.imagenUrl}
                  stock={producto.stock}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* --- COMPONENTE DE LÁMINA --- */}
        <ProductoDetalleModal 
          producto={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      </div>
    </section>
  );
}