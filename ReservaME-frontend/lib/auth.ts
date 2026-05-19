import { getToken, removeToken } from "@/lib/auth-storage";
import { apiPost } from "@/lib/api";


/**
 * Retorna true si existe un JWT almacenado.
 */
export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

/**
 * Retorna el header Authorization listo (o un objeto vacío si no hay token).
 */
export function getAuthHeader(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Elimina el token (logout).
 */
export async function logout() {
  await apiPost("/auth/logout", undefined, { auth: false });
}

export function getTokenOrThrow(): string {
  const token = getToken();
  if (!token) {
    throw new Error("No hay sesión activa (token no encontrado).");
  }
  return token;
}
