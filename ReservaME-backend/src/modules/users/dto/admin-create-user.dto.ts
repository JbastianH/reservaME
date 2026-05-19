import { IsEmail, IsEnum } from "class-validator";

export class AdminCreateUserDto {
  @IsEmail()
  email!: string;

  @IsEnum(["ADMIN", "BARBERO"] as const)
  role!: "ADMIN" | "BARBERO";
}