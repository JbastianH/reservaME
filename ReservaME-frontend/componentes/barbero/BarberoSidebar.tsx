"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/barbero", label: "Resumen" },
  { href: "/barbero/reservas", label: "Mis reservas" },
  { href: "/barbero/servicios", label: "Mis servicios" },
  { href: "/barbero/perfil", label: "Mi perfil" },
  { href: "/barbero/resenas", label: "Mis Reseñas"}
];

export default function BarberoSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white md:block">
      <div className="px-6 py-5">
        <p className="text-xs font-medium text-neutral-500">Panel Barbero</p>
        <h2 className="mt-1 text-lg font-semibold text-black">Black & White Studio</h2>
      </div>

      <nav className="px-3 pb-6">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`mb-1 block rounded-lg px-3 py-2 text-sm transition ${
                active ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}