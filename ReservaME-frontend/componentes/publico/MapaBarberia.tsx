type Props = {
  direccion?: string | null;
  nombre?: string;
  secondaryColor?: string;
};

function esGoogleMapsEmbed(valor: string) {
  return (
    valor.startsWith("https://www.google.com/maps/embed") ||
    valor.startsWith("https://maps.google.com/maps")
  );
}

function obtenerCoordenadasDesdeEmbed(embedUrl: string) {
  const longMatch = embedUrl.match(/!2d(-?\d+(\.\d+)?)/);
  const latMatch = embedUrl.match(/!3d(-?\d+(\.\d+)?)/);

  if (!latMatch?.[1] || !longMatch?.[1]) return null;

  return {
    lat: latMatch[1],
    lng: longMatch[1],
  };
}

function obtenerUrlMapa(direccion: string) {
  if (esGoogleMapsEmbed(direccion)) {
    return direccion;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`;
}

function obtenerUrlAbrirMapa(direccion: string, nombre: string) {
  if (esGoogleMapsEmbed(direccion)) {
    const coordenadas = obtenerCoordenadasDesdeEmbed(direccion);

    if (coordenadas) {
      return `https://www.google.com/maps/search/?api=1&query=${coordenadas.lat},${coordenadas.lng}`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nombre)}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

export default function MapaBarberia({
  direccion,
  nombre = "barbería",
  secondaryColor = "#ffffff",
}: Props) {
  const direccionLimpia = direccion?.trim() || "Santiago, Chile";

  const googleMapsEmbedUrl = obtenerUrlMapa(direccionLimpia);
  const googleMapsUrl = obtenerUrlAbrirMapa(direccionLimpia, nombre);

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
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: `${secondaryColor}33` }}
          />

          <div className="mb-6 h-1 w-28 rounded-full" style={{ backgroundColor: secondaryColor }} />

          <div className="relative mb-8">
            <p
              className="caprasimo-regular mb-2 text-xs font-semibold tracking-[0.35em] uppercase"
              style={{ color: secondaryColor }}
            >
              Ubicación
            </p>

            <h2 className="caprasimo-regular text-3xl font-semibold text-white">
              Dónde encontrarnos
            </h2>
          </div>

          <div
            className="relative overflow-hidden rounded-[2rem] border shadow-xl"
            style={{ borderColor: `${secondaryColor}55` }}
          >
            <iframe
              title={`Mapa de ${nombre}`}
              src={googleMapsEmbedUrl}
              className="h-[380px] w-full transition duration-300"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="pointer-events-none absolute inset-0 bg-black/10" />
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center rounded-full border bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            style={{ borderColor: `${secondaryColor}55` }}
            aria-label={`Ver ubicación de ${nombre} en Google Maps`}
          >
            Ver en Google Maps →
          </a>
        </div>
      </div>
    </section>
  );
}
