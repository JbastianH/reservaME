import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

type CloudinaryVariant = "perfil" | "portafolio" | "productos";

@Injectable()
export class MediaService {
  constructor(private readonly config: ConfigService) {}

  firmarCloudinary(params?: { folder?: string; variant?: CloudinaryVariant }) {
    const cloudName = this.config.getOrThrow<string>("CLOUDINARY_CLOUD_NAME");
    const apiKey = this.config.getOrThrow<string>("CLOUDINARY_API_KEY");
    const apiSecret = this.config.getOrThrow<string>("CLOUDINARY_API_SECRET");

    const baseFolder = this.config.get<string>("CLOUDINARY_FOLDER") ?? "bawstudio";
    const variant = params?.variant ?? "perfil";

    // 1. Definimos el folder y las transformaciones (eager) de forma atómica
    let finalFolder = "";
    let eager = "";

    if (variant === "productos") {
      finalFolder = `${baseFolder}/productos`;
      // Ajustado a w_1000 para diferenciarlo de portafolio y optimizar carga de productos
      eager = "c_limit,w_1000,f_auto,q_auto"; 
    } else if (variant === "portafolio") {
      finalFolder = `${baseFolder}/barberos/portafolio`;
      eager = "c_limit,w_1600,f_auto,q_auto";
    } else {
      // Perfil por defecto
      finalFolder = `${baseFolder}/barberos/perfil`;
      eager = "c_fill,w_512,h_512,g_face,f_auto,q_auto";
    }

    // Si el frontend envía un folder específico, sobreescribimos el default
    if (params?.folder?.trim()) {
      finalFolder = params.folder.trim();
    }

    const eagerAsync = "0";
    const timestamp = Math.floor(Date.now() / 1000);

    // 2. Construcción del string para firmar (ORDEN ALFABÉTICO ESTRICTO: eager, eager_async, folder, timestamp)
    // Es vital que no haya espacios después de las comas en la variable 'eager'
    const stringsToJoin = [
      `eager=${eager}`,
      `eager_async=${eagerAsync}`,
      `folder=${finalFolder}`,
      `timestamp=${timestamp}`,
    ];

    const toSign = `${stringsToJoin.join("&")}${apiSecret}`;
    
    // Generación del hash SHA-1
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    // Log para depuración en la terminal del backend
    console.log("-----------------------------------------");
    console.log("NUEVO BACKEND STRING:", toSign);
    console.log("-----------------------------------------");

    return {
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder: finalFolder,
      eager,
      eagerAsync,
      variant,
    };
  }
}