"use client";

import { usePathname } from "next/navigation";
import { useRouter as useNextRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { Rol } from "@/types/auth";

type Props = {
  children: React.ReactNode;
  rolesPermitidos?: Rol[];
};

type MeResponse = {
  sub: string;
  email: string;
  role: Rol;
};

export default function GuardiaAuth({ children, rolesPermitidos }: Props) {
  const router = useNextRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<"checking" | "ok" | "deny">("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // Importante: auth:false => NO intenta poner Authorization con token local
        // pero igual manda cookies porque tu apiFetch ya usa credentials:"include".
        const me = await apiGet<MeResponse>("/auth/me", { auth: false });

        if (cancelled) return;

        if (rolesPermitidos?.length) {
          if (!rolesPermitidos.includes(me.role)) {
            setStatus("deny");
            router.replace("/no-autorizado");
            return;
          }
        }

        setStatus("ok");
      } catch {
        if (cancelled) return;
        setStatus("deny");
        router.replace(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router, pathname, rolesPermitidos]);

  // Evita el “flash” (no renderiza panel hasta validar)
  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-600">
        Cargando sesión...
      </div>
    );
  }

  if (status === "deny") return null;

  return <>{children}</>;
}