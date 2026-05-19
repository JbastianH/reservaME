import { apiPost } from "@/lib/api";

export type CloudinarySignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  eager: string;
  eagerAsync: string;
  variant: "perfil" | "portafolio" | "productos";
};

export async function firmarCloudinary(params?: { folder?: string; variant?: "perfil" | "portafolio" | "productos" }) {
  return apiPost<CloudinarySignResponse>("/media/cloudinary/sign", params ?? {});
}