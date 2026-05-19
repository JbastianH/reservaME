import { IsString, MinLength } from "class-validator";

export class ActivarCuentaDto {
  @IsString()
  token!: string;

@IsString({ message: "La contraseña es obligatoria." })
@MinLength(8, {
  message: "La contraseña debe tener al menos 8 caracteres.",
})
password!: string;
}