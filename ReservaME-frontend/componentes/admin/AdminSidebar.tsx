"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/barberos", label: "Barberos" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/settings", label: "Configuración" },
  { href: "/admin/productos", label: "Productos" },
];

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="h-full w-64 border-r border-neutral-200 bg-white">
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-black">Panel Admin</p>
        <p className="text-xs text-neutral-500">Black & White Studio</p>
      </div>

      <nav className="px-2 pb-4">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
              className={[
                "block rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-black text-white"
                  : "text-neutral-700 hover:bg-neutral-100",
              ].join(" ")}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}