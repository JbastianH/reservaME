import { Controller, Get, Query } from "@nestjs/common";
import { ServiciosService } from "../servicios/servicios.service";

@Controller("public/servicios")
export class ServiciosPublicosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Get()
  listar(@Query("q") q?: string) {
    return this.serviciosService.listarPublico(q);
  }
}