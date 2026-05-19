import { IsEmail, IsNotEmpty, IsString, Matches, IsUUID, IsOptional, MaxLength } from "class-validator";

export class CrearReservaPublicaDto {
  @IsUUID()
  barberId!: string;

  @IsUUID()
  barberServiceId!: string;

  // ISO string: "2026-01-10T15:00:00.000Z"
  @IsString()
  @IsNotEmpty()
  startAt!: string;

  @IsString()
  @IsNotEmpty()
  clientName!: string;

  @IsString()
  @IsNotEmpty()
  // formato simple (mejorable). Evita basura; no bloquea +56
  @Matches(/^\+?\d{8,15}$/, { message: "Teléfono inválido." })
  clientPhone!: string;

  @IsEmail()
  clientEmail!: string;


  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

}