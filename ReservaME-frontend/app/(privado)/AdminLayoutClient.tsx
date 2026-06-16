"use client";

import { useState } from "react";
import AdminSidebar from "@/componentes/admin/AdminSidebar";
import AdminTopbar from "@/componentes/admin/AdminTopbar";
import Footer from "@/componentes/layout/Footer";
import GuardiaAuth from "@/componentes/auth/GuardAuth";

type Props = {
  children: React.ReactNode;
  tenantName: string;
  logoUrl?: string | null;
};

export default function AdminLayoutClient({ children, tenantName, logoUrl }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <GuardiaAuth rolesPermitidos={["ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-neutral-50">
        <AdminTopbar onOpenMenu={() => setOpen(true)} />

        <div className="mx-auto flex w-full max-w-7xl flex-1">
          <div className="hidden md:block">
            <AdminSidebar />
          </div>

          {open ? (
            <div className="fixed inset-0 z-20 md:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

              <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-xl">
                <AdminSidebar onNavigate={() => setOpen(false)} />
              </div>
            </div>
          ) : null}

          <main className="w-full p-4 md:p-6">{children}</main>
        </div>

        <div className="mt-auto">
          <Footer tenantName={tenantName} />
        </div>
      </div>
    </GuardiaAuth>
  );
}
