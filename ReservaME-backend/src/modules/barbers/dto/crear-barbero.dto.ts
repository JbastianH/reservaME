import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Matches, MaxLength, IsUrl } from "class-validator";

export class CrearBarberoDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  @Length(2, 80)
  name!: string;

  // NUEVO: Campo obligatorio para la redirección a Setmore
  @IsString()
  @IsNotEmpty({ message: "El link es obligatorio" })
  @IsUrl({}, { message: "El link de reserva debe ser una URL válida (ej: https://...)" })
  linkSetmore!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(80)
  slug?: string;

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
  @IsBoolean()
  isActive?: boolean;
}