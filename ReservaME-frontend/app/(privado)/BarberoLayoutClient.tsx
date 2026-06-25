"use client";

import { useState } from "react";
import BarberoSidebar from "@/componentes/barbero/BarberoSidebar";
import BarberoTopbar from "@/componentes/barbero/BarberoTopbar";
import Footer from "@/componentes/layout/Footer";
import GuardiaAuth from "@/componentes/auth/GuardAuth";

type Props = {
  children: React.ReactNode;
  tenantName: string;
};

export default function BarberoLayoutClient({ children, tenantName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <GuardiaAuth rolesPermitidos={["BARBERO"]}>
      <div className="flex min-h-screen flex-col bg-neutral-50">
        <BarberoTopbar tenantName={tenantName} onOpenMenu={() => setOpen(true)} />

        <div className="mx-auto flex w-full max-w-7xl flex-1">
          <div className="hidden md:block">
            <BarberoSidebar />
          </div>

          {open ? (
            <div className="fixed inset-0 z-20 md:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

              <div className="absolute top-0 left-0 h-full w-72 bg-white shadow-xl">
                <BarberoSidebar onNavigate={() => setOpen(false)} />
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
