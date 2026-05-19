"use client";

import { usePathname } from "next/navigation";

export default function PwaManifest() {
  const pathname = usePathname();
  
  // Si la ruta es exactamente /portal-baw o empieza con /portal-baw
  const manifestUrl = pathname?.startsWith("/portal-baw") 
    ? "/manifest-admin.json" 
    : "/manifest.json";

  return <link rel="manifest" href={manifestUrl} />;
}