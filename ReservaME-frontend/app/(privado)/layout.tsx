// app/(privado)/layout.tsx
"use client";

import { SesionProvider } from "@/context/SesionProvider";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <SesionProvider>
      {children}
    </SesionProvider>
  );
}