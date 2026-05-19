import CarruselBarberosSwiper from "@/componentes/publico/CarruselBarberos";
import MapaBarberia from "@/componentes/publico/MapaBarberia";
import { listarBarberosPublico } from "@/services/barberos.service";
import { listarProductosPublico } from "@/services/productos.service"; 
import CarruselListaProductos from "@/componentes/publico/CarruselProductos";

export default async function HomePublica() {
  // Se ejecutan ambas peticiones al backend de NestJS
  const barberos = await listarBarberosPublico();
  const productos = await listarProductosPublico();

  return (
    <main className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Imagen de fondo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/img/hero.png')" }}
        />

        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Fade superior */}
        <div className="pointer-events-none absolute top-0 right-0 left-0 h-24 bg-gradient-to-b from-black to-transparent" />

        {/* Fade inferior */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-black to-transparent" />

        {/* Contenido */}
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32">
          <h1 className="brand-title text-4xl text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-7xl">
            Black & White Studio
          </h1>
          <p className="mt-4 text-sm text-white/80 sm:text-base md:text-lg lg:text-xl">
            Reserva con tu barbero de confianza
          </p>
        </div>
      </section>

      {/* Carrusel del equipo de trabajo */}
      <CarruselBarberosSwiper barberos={barberos} />
      
      {/* Nuevo carrusel de la tienda (inventario activo) */}
      <CarruselListaProductos productos={productos} />

      {/* Ubicación del local */}
      <MapaBarberia />
    </main>
  );
}