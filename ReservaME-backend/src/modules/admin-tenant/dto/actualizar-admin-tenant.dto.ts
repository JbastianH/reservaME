import { IsOptional, IsString } from 'class-validator';

export class ActualizarAdminTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  heroImageUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  headerColor?: string;

  @IsOptional()
  @IsString()
  footerColor?: string;

  @IsOptional()
  @IsString()
  fontFamily?: string;
}
