export default function MapaBarberia() {
  return (
    <section className="bg-black py-16">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="caprasimo-regular mb-6 text-3xl font-semibold text-white">Dónde encontrarnos</h2>

        <a
          href="https://maps.app.goo.gl/HwRxgpmUgCgMLUDg8"
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13376.9632324619!2d-71.60844579947585!3d-33.05012652517049!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9689e0dcb119f007%3A0x2a89b53460845ae4!2sOscar%20Albornoz!5e0!3m2!1ses-419!2scl!4v1768858535058!5m2!1ses-419!2scl"
              className="h-[380px] w-full transition duration-300 group-hover:opacity-90"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Overlay sutil */}
            <div className="pointer-events-none absolute inset-0 bg-black/10" />
          </div>

          <p className="mt-3 text-sm text-white/70 group-hover:text-white">Ver en Google Maps →</p>
        </a>
      </div>
    </section>
  );
}
