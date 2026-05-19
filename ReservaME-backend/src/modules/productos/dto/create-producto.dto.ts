import { IsString, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateProductoDto {
  // Se valida que el nombre sea una cadena de texto obligatoria
  @IsString()
  nombre!: string;

  // Se valida que la descripción sea una cadena de texto opcional
  @IsOptional()
  @IsString()
  descripcion?: string;

  // Se valida que el precio sea un número entero y como mínimo 0
  @IsInt()
  @Min(0)
  precio!: number;

  // Se valida que el stock sea un número entero opcional y como mínimo 0
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  // Se valida que la URL de la imagen sea texto opcional
  @IsOptional()
  @IsString()
  imagenUrl?: string;

  // Se valida que el estado activo sea un booleano opcional
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}