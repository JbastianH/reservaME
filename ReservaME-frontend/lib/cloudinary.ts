import { firmarCloudinary } from "@/services/media.service";

export async function subirImagenCloudinary(file: File, folder?: string) {
  const sign = await firmarCloudinary({ folder });

  const url = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "No se pudo subir la imagen a Cloudinary.");
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("Cloudinary no devolvió secure_url.");

  return data.secure_url;
}