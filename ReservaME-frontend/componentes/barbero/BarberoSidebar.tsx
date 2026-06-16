"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  onNavigate?: () => void;
};

const links = [
  { href: "/barbero", label: "Resumen" },
  { href: "/barbero/reservas", label: "Mis reservas" },
  { href: "/barbero/servicios", label: "Mis servicios" },
  { href: "/barbero/perfil", label: "Mi perfil" },
  { href: "/barbero/resenas", label: "Mis reseñas" },
];

export default function BarberoSidebar({ onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-[calc(100vh-3.5rem)] w-72 flex-col border-r border-neutral-200 bg-white md:w-64">
      <div className="px-6 py-5">

      </div>

      <nav className="flex-1 px-3 pb-6">
        {links.map((l) => {
          const active = pathname === l.href;

          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
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
