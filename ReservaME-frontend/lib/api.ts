// /lib/api.ts
import { API_BASE_URL } from "@/lib/constants";
import { getToken } from "@/lib/auth-storage";
export { API_BASE_URL };

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
};

async function getTenantHost(): Promise<string | null> {
  if (typeof window !== "undefined") {
    return window.location.host;
  }

  try {
    const { headers } = await import("next/headers");
    const requestHeaders = await headers();
    return requestHeaders.get("host");
  } catch {
    return null;
  }
}

async function parseErrorBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json().catch(() => null);
  }
  return res.text().catch(() => null);
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(options.headers);
  const tenantHost = await getTenantHost();
  if (tenantHost && !headers.has("x-tenant-host")) {
    headers.set("x-tenant-host", tenantHost);
  }

  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const auth = options.auth ?? true;

  if (auth && !headers.has("Authorization")) {
    const token = getToken();
    if (token && token !== "undefined" && token !== "null") {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
    credentials: "include",
  });

  // Manejo especial de sesión expirada
  if (res.status === 401 && auth) {
    const body = await parseErrorBody(res);

    const error: ApiError = {
      status: 401,
      message: "Sesión expirada. Vuelve a iniciar sesión.",
      details: body,
    };

    throw error;
  }

  if (!res.ok) {
    const body = await parseErrorBody(res);

    type ErrorBody = { message?: string | string[] };

    const message =
      typeof body === "string"
        ? body
        : ((body as ErrorBody | null)?.message ?? res.statusText ?? "Error en la API");

    const error: ApiError = {
      status: res.status,
      message: Array.isArray(message) ? message.join(", ") : String(message),
      details: body,
    };

    throw error;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  // Si alguna ruta devuelve texto se soporta
  return (await res.text()) as unknown as T;
}

// Helpers comunes (para no repetir options)
export function apiGet<T>(path: string, options?: ApiFetchOptions) {
  return apiFetch<T>(path, { method: "GET", ...options });
}

export function apiPost<T>(path: string, data?: unknown, options?: ApiFetchOptions) {
  return apiFetch<T>(path, {
    method: "POST",
    body: data === undefined ? undefined : JSON.stringify(data),
    ...options,
  });
}

export function apiPatch<T>(path: string, data?: unknown, options?: ApiFetchOptions) {
  return apiFetch<T>(path, {
    method: "PATCH",
    body: data === undefined ? undefined : JSON.stringify(data),
    ...options,
  });
}

export function apiDelete<T>(path: string, options?: ApiFetchOptions) {
  return apiFetch<T>(path, { method: "DELETE", ...options });
}