"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { useSession } from "@/context/SesionProvider";

const links = [
  { href: "/barbero", label: "Resumen" },
  { href: "/barbero/reservas", label: "Mis reservas" },
  { href: "/barbero/servicios", label: "Mis servicios" },
  { href: "/barbero/perfil", label: "Mi perfil" },
  { href: "/barbero/resenas", label: "Mis reseñas" },
];

type Props = {
  email?: string;
  tenantName?: string;
  onOpenMenu?: () => void;
};

export default function BarberoTopbar({
  email: propEmail,
  tenantName = "ReservaME",
  onOpenMenu,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession } = useSession();

  const displayEmail = user?.email || propEmail;

  async function handleLogout() {
    try {
      router.push("/login");
      await logout();
    } catch (error) {
      console.error("Error logout backend", error);
    } finally {
      clearSession();

      document.cookie = "auth_flag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-black md:hidden"
            aria-label="Abrir menú"
          >
            ☰
          </button>

          <div className="min-w-0">
            <p className="text-xs text-neutral-500">Panel Barbero</p>
            <p className="truncate text-sm font-semibold text-black">{tenantName}</p>
          </div>
        </div>

        {/* Navegación escritorio */}
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

          {displayEmail ? <span className="text-sm text-neutral-500">{displayEmail}</span> : null}

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-black transition-colors hover:bg-neutral-100"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Cerrar sesión móvil */}
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-black transition-colors hover:bg-neutral-100 md:hidden"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}
