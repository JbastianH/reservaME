"use client";

import { useLoading } from "@/context/LoadingProvider";
import { useEffect, useState } from "react";

export default function PageSkeleton() {
  const { isLoading } = useLoading();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="space-y-4 text-center drop-shadow-[0_0_15px_rgba(255,255,255,1.0)]">
            <div className="flex justify-center">
              <img 
                src="/img/logoPNG-sinFondo.png" 
                alt="Cargando Barbería..." 
                className="h-40 w-40 animate-pulse object-contain" 
              />
            </div>
            
            {/* Texto de carga */}
            <p className="text-sm font-medium text-black">Cargando...</p>
            
          </div>

        </div>
      )}
    </>
  );
}