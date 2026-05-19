import { apiPost } from "@/lib/api";
import type { ActivarCuentaRequest, ActivarCuentaResponse } from "@/types/activacion";

export function activarCuenta(data: ActivarCuentaRequest) {
  return apiPost<ActivarCuentaResponse>("/auth/activar", data, { auth: false });
}

export async function reenviarActivacionAdmin(dto: { email: string }) {
  return apiPost<{ ok: true }>("/auth/admin/usuarios/reenviar-activacion", dto);
}

export async function solicitarRecuperacion(email: string) {
  return await apiPost("/auth/solicitar-recuperacion", { email });
}

export async function resetPassword(dto: any) {
  return await apiPost("/auth/reset-password", dto);
}