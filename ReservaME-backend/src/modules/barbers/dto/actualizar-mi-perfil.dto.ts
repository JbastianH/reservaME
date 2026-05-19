import { IsOptional, IsString, MaxLength, IsUrl } from "class-validator";

export class ActualizarMiPerfilDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: "El link de reserva debe ser una URL válida (ej: https://...)" })
  linkSetmore?: string;
}