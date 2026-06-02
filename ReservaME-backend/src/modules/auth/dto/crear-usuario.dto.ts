import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
  ValidateIf,
} from "class-validator";

export enum RolUsuarioDto {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  BARBERO = "BARBERO",
}

export class CrearUsuarioDto {
  @IsEmail()
  email!: string;

  @IsEnum(RolUsuarioDto)
  role!: RolUsuarioDto;

  // SOLO cuando es BARBERO
  @ValidateIf(o => o.role === RolUsuarioDto.BARBERO)
  @IsString()
  @MinLength(2)
  name!: string;

  // SLUG obligatorio SOLO para BARBERO
  @ValidateIf(o => o.role === RolUsuarioDto.BARBERO)
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug inválido (usa minúsculas, números y guiones)",
  })
  slug!: string;

  // Opcionales
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsUrl()

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}