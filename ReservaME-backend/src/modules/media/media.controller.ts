import { Body, Controller, Post } from "@nestjs/common";
import { Auth } from "../../common/decorators/auth.decorator";
import { MediaService } from "./media.service";

@Auth("BARBERO", "ADMIN") // Solo barberos y administradores pueden acceder a esta ruta
@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("cloudinary/sign")
  signCloudinary(@Body() body: { folder?: string; variant?: "perfil" | "portafolio" | "productos" }) {
    return this.mediaService.firmarCloudinary(body);
  }
}