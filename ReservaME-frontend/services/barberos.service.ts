import { apiGet } from "@/lib/api";

export type PublicBarberoItem = {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  phone?: string | null;
  linkSetmore: string;
  photoUrl?: string | null;

  portfolioImages: {
    id: string;
    imageUrl: string;
    position: number;
  }[];
};
export type PublicServicioDeBarberoItem = {
  id: string; // barberServiceId
  barberId: string;
  serviceId: string;
  price: string;        // viene como string por ser Decimal
  durationMin: number;
  isActive: boolean;
  service: {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
  };
};

export function listarBarberosPublico(
  q?: string,
  tenantHost?: string | null,
) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";

  return apiGet<PublicBarberoItem[]>(`/public/barberos${qs}`, {
    auth: false,
    tenantHost,
  });
}

export function obtenerBarberoPublico(slug: string, tenantHost?: string | null) {
  return apiGet<PublicBarberoItem>(`/public/barberos/${encodeURIComponent(slug)}`, { auth: false, tenantHost });
}

export function listarServiciosDeBarberoPublico(slug: string, tenantHost?: string | null) {
  return apiGet<PublicServicioDeBarberoItem[]>(
    `/public/barberos/${encodeURIComponent(slug)}/servicios`,
    { auth: false, tenantHost },
  );
}