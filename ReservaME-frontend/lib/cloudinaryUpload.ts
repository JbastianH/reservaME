import { firmarCloudinary } from "@/services/media.service";

type UploadResult = {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  bytes?: number;
  eager?: Array<{ secure_url?: string; url?: string }>;
};

export async function subirImagenCloudinary(params: {
  file: File;
  folder?: string;
  variant?: "perfil" | "portafolio" | "productos";
}) {
  const sign = await firmarCloudinary({ folder: params.folder, variant: params.variant });
  console.log("FRONTEND EAGER:", sign.eager);
  const form = new FormData();
  form.append("file", params.file);
  form.append("eager", sign.eager);
  form.append("eager_async", sign.eagerAsync);
  form.append("folder", sign.folder);
  form.append("timestamp", String(sign.timestamp));
  form.append("api_key", sign.apiKey);
  form.append("signature", sign.signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;

  
  const res = await fetch(uploadUrl, { method: "POST", body: form });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`No se pudo subir la imagen a Cloudinary. ${txt}`);
    
  }

  const data = (await res.json()) as UploadResult;  

  // Preferimos eager (optimizada)
  const optimizedUrl = data?.eager?.[0]?.secure_url ?? data.secure_url;
  if (!optimizedUrl) throw new Error("Cloudinary no devolvió una URL.");

  return {
    secureUrl: optimizedUrl,
    publicId: data.public_id,
    bytes: data.bytes,
    width: data.width,
    height: data.height,
  };
}