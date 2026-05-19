import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-800 bg-black">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
        
        {/* Texto de Copyright */}
        <div className="text-sm text-neutral-500 text-center sm:text-left">
          © {new Date().getFullYear()} Black & White Studio. Todos los derechos reservados.
        </div>
        
        {/* Contenedor de Redes Sociales */}
        <div className="flex items-center gap-4">
          <Link
            href="https://instagram.com/studiobarber_bw" // Recuerda cambiar al link real
            target="_blank"
            rel="noopener noreferrer"
            /* 
              Botón siempre encendido:
              El bg-gradient y text-white están siempre activos.
              El hover ahora solo aumenta el brillo de la sombra y hace zoom al ícono.
            */
            className="group flex h-10 w-10 items-center justify-center rounded-full text-white bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 shadow-[0_0_10px_rgba(139,92,246,0.4)] transition-all duration-300 hover:shadow-[0_0_15px_rgba(217,70,239,0.6)] active:scale-95 active:shadow-[0_0_20px_rgba(217,70,239,0.8)]"
            aria-label="Ir al Instagram de Black & White Studio"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:scale-110"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </Link>
        </div>

      </div>
    </footer>
  );
}