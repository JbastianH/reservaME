export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

if (!API_BASE_URL) {
  throw new Error("Falta NEXT_PUBLIC_API_BASE_URL en .env.local");
}