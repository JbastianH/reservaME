import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class CreateServicioDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Usamos string para Decimal (Prisma-friendly)
  @IsOptional()
  @IsString()
  basePrice?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  baseDurationMin?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}