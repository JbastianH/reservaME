import {
  IsBoolean,
  IsEmail,
  IsHexColor,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  domain!: string;

  @IsEmail()
  adminEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  address?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsHexColor()
  headerColor?: string;

  @IsOptional()
  @IsHexColor()
  footerColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  fontFamily?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  instagramUrl?: string;
}
