"use client";

import { usePathname } from "next/navigation";

export default function PwaManifest() {
  const pathname = usePathname();
  
  const manifestUrl = pathname?.startsWith("/login") 
    ? "/manifest-admin.json" 
    : "/manifest.json";

  return <link rel="manifest" href={manifestUrl} />;
}