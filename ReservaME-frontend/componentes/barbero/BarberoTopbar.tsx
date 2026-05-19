"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // 1. Importar useRouter
import { logout } from "@/lib/auth"; // 2. Importar servicio logout
import { useSession } from "@/context/SesionProvider"; // 3. Importar hook de sesión

const links = [
  { href: "/barbero", label: "Resumen" },
  { href: "/barbero/reservas", label: "Mis reservas" },
  { href: "/barbero/servicios", label: "Mis servicios" },
  { href: "/barbero/perfil", label: "Mi perfil" },
  { href: "/barbero/resenas", label: "Mis Reseñas" }
];

type Props = {
  email?: string; 
};

export default function BarberoTopbar({ email: propEmail }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter(); // Hook del router
  const { user, clearSession } = useSession(); // Datos de sesión

  // Usamos el email del contexto, o el prop si fallara el contexto
  const displayEmail = user?.email || propEmail;

  // FUNCIÓN DE LOGOUT SEGURA
  async function handleLogout() {
    try {
      // 1. Primero redirigimos al usuario fuera de la zona protegida
      // Usamos router.push para que Next.js maneje la transición internamente
      router.push("/portal-baw");
      
      // 2. Intentamos el logout en el backend
      await logout(); 
    } catch (error) {
      console.error("Error logout backend", error);
    } finally {
      // 3. Limpiamos los estados de React
      clearSession();

      // 4. Rompemos la bandera
      // IMPORTANTE: Asegúrate de borrarla en el dominio correcto
      document.cookie = "auth_flag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      setOpen(false);
      
      // 5. Opcional: Solo si el router.push no fuera suficiente, 
      // podrías forzar un refresh después de un breve delay
      // setTimeout(() => window.location.reload(), 100);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Botón menú móvil */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-black md:hidden"
            aria-label="Abrir menú"
          >
            ☰
          </button>

          <div>
            <p className="text-xs text-neutral-500">Panel Barbero</p>
            <p className="text-sm font-semibold text-black">Black & White Studio</p>
          </div>
        </div>

        {/* Nav desktop + logout */}
        <div className="hidden items-center gap-4 md:flex">
          <nav className="flex items-center gap-2">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    active ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Email */}
          {displayEmail ? <span className="text-sm text-neutral-500">{displayEmail}</span> : null}

          {/* Botón Logout Desktop */}
          <button
            onClick={handleLogout}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-black hover:bg-neutral-100 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {open ? (
        <div className="border-t border-neutral-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    active ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout móvil */}
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-black hover:bg-neutral-100 font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </header>
  );
}