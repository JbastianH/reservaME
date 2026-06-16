import { headers } from "next/headers";
import CarruselBarberosSwiper from "@/componentes/publico/CarruselBarberos";
import MapaBarberia from "@/componentes/publico/MapaBarberia";
import { listarBarberosPublico } from "@/services/barberos.service";
import { listarProductosPublico } from "@/services/productos.service";
import CarruselListaProductos from "@/componentes/publico/CarruselProductos";
import { obtenerTenantPublico } from "@/services/tenant-publico.service";
import { obtenerVariableFuente } from "@/lib/fuentes-css";
import Reveal from "@/componentes/animaciones/Reveal";

export default async function HomePublica() {
  const requestHeaders = await headers();
  const tenantHost = requestHeaders.get("host");

  const [tenant, barberos, productos] = await Promise.all([
    obtenerTenantPublico(tenantHost),
    listarBarberosPublico(undefined, tenantHost),
    listarProductosPublico(tenantHost),
  ]);

  const settings = tenant.settings;

  const heroImage = settings.heroImageUrl || "/img/hero.png";
  const backgroundColor = settings.primaryColor || "#000000";
  const accentColor = settings.secondaryColor || "#ffffff";
  const fontFamily = obtenerVariableFuente(settings.fontFamily);

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor,
        fontFamily,
      }}
    >
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Imagen de fondo */}
        <Reveal delay={0.35} direction="up" className="absolute inset-0">
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: `url("${heroImage}")`,
            }}
          />
        </Reveal>

        {/* Overlay suave usando el color primario del tenant */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor,
            opacity: 0.12,
          }}
        />

        {/* Fade superior según color primario */}
        <div
          className="pointer-events-none absolute top-0 right-0 left-0 h-24"
          style={{
            background: `linear-gradient(to bottom, ${backgroundColor}, transparent)`,
          }}
        />

        {/* Fade inferior según color primario */}
        <div
          className="pointer-events-none absolute right-0 bottom-0 left-0 h-32"
          style={{
            background: `linear-gradient(to top, ${backgroundColor}, transparent)`,
          }}
        />

        {/* Contenido */}
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32">
          <Reveal delay={0.30} direction="left">
            <div className="mb-5 h-1 w-24 rounded-full" style={{ backgroundColor: accentColor }} />
          </Reveal>

          <Reveal delay={0.35} direction="right">
            <h1
              className="max-w-5xl text-white"
              style={{
                fontFamily,
                fontSize: "clamp(3.5rem, 6vw, 5.5rem)",
                lineHeight: "0.95",
                letterSpacing: "0.01em",
                fontWeight: 400,
              }}
            >
              {tenant.name}
            </h1>
          </Reveal>

          <Reveal delay={0.40} direction="left">
            <p
              className="mt-6 max-w-4xl text-white/80"
              style={{
                fontFamily,
                fontSize: "clamp(1rem, 2vw, 1.5rem)",
                lineHeight: "1.2",
                letterSpacing: "0.03em",
                fontWeight: 400,
              }}
            >
              Reserva con tu profesional de confianza
            </p>
          </Reveal>
        </div>
      </section>

      {/* Carrusel del equipo de trabajo */}
      <Reveal delay={0.20} direction="right">
        <CarruselBarberosSwiper
          barberos={barberos}
          secondaryColor={tenant.settings.secondaryColor}
        />
      </Reveal>

      {/* Carrusel de la tienda */}
      <Reveal delay={0.10} direction="left">
        <CarruselListaProductos
          productos={productos}
          secondaryColor={tenant.settings.secondaryColor}
        />
      </Reveal>

      {/* Ubicación del local */}
      <Reveal delay={0.10} direction="right">
        <MapaBarberia
          direccion={tenant.address}
          nombre={tenant.name}
          secondaryColor={tenant.settings.secondaryColor}
        />
      </Reveal>
    </main>
  );
}
