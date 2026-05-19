import { Controller, Get, Query } from "@nestjs/common";
import { DisponibilidadPublicaService } from "./disponibilidad-publica.service";

@Controller("public/disponibilidad")
export class DisponibilidadPublicaController {
  constructor(private readonly service: DisponibilidadPublicaService) {}

  @Get()
  obtener(
    @Query("slug") slug: string,
    @Query("date") date: string,
  ) {
    return this.service.obtenerDisponibilidad(slug, date);
  }
}