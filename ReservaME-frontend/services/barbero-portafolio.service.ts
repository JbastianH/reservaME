import { apiGet, apiPost, apiPatch } from "@/lib/api";

export type PortafolioItem = {
  id: string;
  barberId: string;
  imageUrl: string;
  position: number;
  visible: boolean;
  hiddenByAdmin: boolean;
  hiddenReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listarMiPortafolio() {
  return apiGet<PortafolioItem[]>("/barbero/portafolio");
}

export async function crearFotoPortafolio(payload: { imageUrl: string; position?: number }) {
  return apiPost<PortafolioItem>("/barbero/portafolio", payload);
}

// Toggle visible (borrado lógico / ocultar)
export async function setVisibleFotoPortafolio(id: string, visible: boolean) {
  return apiPatch<PortafolioItem>(`/barbero/portafolio/${id}/visible`, { visible });
}

export async function eliminarFotoPortafolio(id: string) {
  return apiPatch<{ ok: true }>(`/barbero/portafolio/${id}/eliminar`, {});
}