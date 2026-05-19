import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class AsignarServicioBarberoDto {
  @IsString()
  serviceId!: string; // UUID en string

  @IsString()
  price!: string; // Decimal como string (Prisma.Decimal-friendly)

  @IsInt()
  @Min(1)
  durationMin!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}