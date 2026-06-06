"use client";

import { useSession } from "@/context/SesionProvider";
import { logout } from "@/lib/auth";
import Image from "next/image";

export default function SuperAdminTopbar() {
  const { user, loading, clearSession } = useSession();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    } finally {
      clearSession();
      document.cookie = "auth_flag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      window.location.href = "/login";
    }
  }

  return (
    <header className="sticky top-4 z-10">
  <div className="mx-auto max-w-7xl px-4">
    <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-4 shadow-sm sm:h-25 sm:flex-row sm:items-center sm:justify-between">

      {/* Logo */}
      <Image
        src="https://res.cloudinary.com/dllykgnb0/image/upload/v1780457196/Logo_ReservaME_sin_fondo_oltrvn.png"
        alt="ReservaME"
        width={280}
        height={50}
        priority
      />

      {/* Usuario + Logout */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
        {!loading && user ? (
          <span className="text-xs text-neutral-600 break-all sm:break-normal">
            {user.email}
          </span>
        ) : null}

        <button
          onClick={handleLogout}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-black transition-colors hover:bg-neutral-200"
        >
          Cerrar sesión
        </button>
      </div>

    </div>
  </div>
</header>
  );
}
