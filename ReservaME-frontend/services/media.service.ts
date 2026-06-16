import { apiPost } from "@/lib/api";

export type CloudinaryVariant =
  | "perfil"
  | "portafolio"
  | "productos"
  | "tenant-logo"
  | "tenant-hero";

export type CloudinarySignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  eager: string;
  eagerAsync: string;
  variant: CloudinaryVariant;
};

export type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
  url: string;
  eager?: Array<{
    secure_url: string;
    url: string;
  }>;
};

export async function firmarCloudinary(params?: { folder?: string; variant?: CloudinaryVariant }) {
  return apiPost<CloudinarySignResponse>("/media/cloudinary/sign", params ?? {});
}

export async function subirArchivoCloudinary(params: {
  file: File;
  variant: CloudinaryVariant;
  folder?: string;
}) {
  const firma = await firmarCloudinary({
    variant: params.variant,
    folder: params.folder,
  });

  const formData = new FormData();

  formData.append("file", params.file);
  formData.append("api_key", firma.apiKey);
  formData.append("timestamp", String(firma.timestamp));
  formData.append("signature", firma.signature);
  formData.append("folder", firma.folder);
  formData.append("eager", firma.eager);
  formData.append("eager_async", firma.eagerAsync);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("No se pudo subir la imagen a Cloudinary.");
  }

  const data = (await response.json()) as CloudinaryUploadResponse;

  return {
    url: data.secure_url,
    publicId: data.public_id,
    original: data,
  };
}
