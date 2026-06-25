import { IsOptional, IsString } from 'class-validator';

export class ListarBarberTimeBlocksQueryDto {
  @IsOptional()
  @IsString()
  barberId?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}