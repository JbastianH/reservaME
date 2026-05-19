import crypto from "crypto";

export function generarTokenSeguro(bytes = 32) {
  // Token para URL (base64url)
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}