"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = useMemo(
    () => [
      { href: "/", label: "Inicio" },
      { href: "/login", label: "Iniciar sesión" },
    ],
    [],
  );

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname?.startsWith(href);
  }

  return (
    <header className="w-full border-b border-neutral-200 bg-white text-black">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Renderiza el enlace con el logo de la marca alineado a la izquierda. */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/img/logoPNG-sinFondo.png"
            alt="Black & White Studio"
            width={200}
            height={200}
            className="object-contain"
            priority
          />
        </Link>

        {/* Agrupa los elementos del lado derecho del header. */}
        <div className="flex items-center gap-4">
          
          {/* Renderiza el botón de Instagram con el fondo degradado y la sombra brillante visibles de forma permanente. */}
          <Link
            href="https://instagram.com/studiobarber_bw"
            target="_blank"
            rel="noopener noreferrer"
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
    </header>
  );
}