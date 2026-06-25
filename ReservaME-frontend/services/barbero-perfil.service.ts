import { apiGet, apiPatch } from "@/lib/api";

export type BarberoMe = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
  userId: string | null;
  user?: {
    email: string;
    role?: "ADMIN" | "BARBERO";
    isActive: boolean;
  } | null;
};

export function getBarberoMe() {
  return apiGet<BarberoMe>("/barbero/me");
}

export function patchBarberoMe(dto: {
  bio?: string;
  phone?: string;
  photoUrl?: string;
}) {
  return apiPatch<BarberoMe>("/barbero/me", dto);
}