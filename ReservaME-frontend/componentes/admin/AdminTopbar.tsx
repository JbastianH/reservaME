"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { useSession } from "@/context/SesionProvider";

export default function AdminTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const router = useRouter();
  const { user, loading, clearSession } = useSession();

  async function handleLogout() {
    try {
      // avisar al backend para que borre la cookie segura (HttpOnly)
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    } finally {
      clearSession();
      // Borrar manualmente la "bandera" que usa el Middleware
      // Esto cierra la puerta inmediatamente.
      document.cookie = "auth_flag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // Redirección inmediata y limpieza de caché de ruta
      window.location.href = "/portal-baw";
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Botón menú móvil */}
          <button
            onClick={onOpenMenu}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-black hover:bg-neutral-50 md:hidden"
          >
            Menú
          </button>

          <span className="text-sm font-medium text-black">Administración</span>
        </div>

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <span className="hidden text-xs text-neutral-600 sm:block">{user.email}</span>
          ) : null}

          <button
            onClick={handleLogout}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-black hover:bg-neutral-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}