"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type SessionUser = {
  id?: string;
  sub?: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "BARBERO";
};

type SesionContextValue = {
  user: SessionUser | null;
  loading: boolean;
  refetchSession: () => Promise<void>;
  clearSession: () => void;
};

const SesionContext = createContext<SesionContextValue | undefined>(undefined);

export function SesionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refetchSession() {
    setLoading(true);
    try {
      const user = await apiFetch<SessionUser>("/auth/me", {
        method: "GET",
      });
      setUser(user);
    } catch (e) {
      // Si falla /auth/me, significa que no hay sesión válida
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function clearSession() {
    setUser(null);
    setLoading(false);
  }

  useEffect(() => {
    void refetchSession();
  }, []);

  const value = useMemo(
    () => ({ user, loading, refetchSession, clearSession }),
    [user, loading],
  );

  return <SesionContext.Provider value={value}>{children}</SesionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SesionProvider />");
  return ctx;
}