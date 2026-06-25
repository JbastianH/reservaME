import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearBarberTimeBlockDto {
  @IsOptional()
  @IsString()
  barberId?: string;

  @IsString()
  @IsNotEmpty()
  startAtIso!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}