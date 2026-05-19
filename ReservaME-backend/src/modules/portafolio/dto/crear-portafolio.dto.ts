import { IsString, MaxLength } from "class-validator";

export class CrearPortafolioDto {
  @IsString()
  @MaxLength(1000)
  imageUrl!: string;
}