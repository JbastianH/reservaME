const TOKEN_KEY = "bawstudio_access_token";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Se deja una advertencia en producción si aún se usa localStorage para JWT.
 * Esto sirve como “seguro anti-olvido” antes de un despliegue final.
 */
function warnIfProduction() {
  if (isProduction) {
    console.warn(
      "[AUTH WARNING] Se está usando localStorage para JWT en producción. " +
        "Se recomienda migrar a cookies httpOnly antes de un despliegue final.",
    );
  }
}

/**
 * Retorna el JWT almacenado o null si no existe.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  warnIfProduction();
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Guarda el JWT en localStorage.
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;

  warnIfProduction();
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Elimina el JWT (logout).
 */
export function removeToken(): void {
  if (typeof window === "undefined") return;

  warnIfProduction();
  localStorage.removeItem(TOKEN_KEY);
}