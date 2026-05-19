import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class ActualizarServicioBarberoDto {
  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}