import { IsNotEmpty, IsString } from "class-validator";

export class GestionarReservaDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}