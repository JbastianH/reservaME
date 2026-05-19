"use client";

import { useSession } from "@/context/SesionProvider";
import BarberoTopbar from "@/componentes/barbero/BarberoTopbar"; 
import BarberoSidebar from "@/componentes/barbero/BarberoSidebar"; 
import GuardiaAuth from "@/componentes/auth/GuardAuth"; 
import Footer from "@/componentes/layout/Footer"; 

export default function BarberoLayout({ children }: { children: React.ReactNode }) {
  const { user } = useSession();

  return (
    <GuardiaAuth rolesPermitidos={["BARBERO"]}>
      <div className="flex min-h-screen flex-col bg-neutral-50">    
        <BarberoTopbar email={user?.email ?? ""} />
        <div className="mx-auto flex w-full max-w-7xl flex-1">
          
          <BarberoSidebar />
          
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
        <Footer />
    
      </div>
    </GuardiaAuth>
  );
}