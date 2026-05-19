"use client";

import { useState } from "react";
import AdminSidebar from "@/componentes/admin/AdminSidebar";
import AdminTopbar from "@/componentes/admin/AdminTopbar";
import Footer from "@/componentes/layout/Footer";
import GuardiaAuth from "@/componentes/auth/GuardAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <GuardiaAuth rolesPermitidos={["ADMIN"]}>
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <AdminTopbar onOpenMenu={() => setOpen(true)} />

        <div className="mx-auto flex w-full max-w-7xl flex-1">
          {/* Sidebar desktop */}
          <div className="hidden md:block">
            <AdminSidebar />
          </div>

          {/* Drawer móvil */}
          {open ? (
            <div className="fixed inset-0 z-20 md:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
                <AdminSidebar onNavigate={() => setOpen(false)} />
              </div>
            </div>
          ) : null}

          {/* Contenido */}
          <main className="w-full p-4 md:p-6">{children}</main>
        </div>

        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </GuardiaAuth>
  );
}