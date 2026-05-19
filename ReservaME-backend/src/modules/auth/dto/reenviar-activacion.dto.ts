import { IsEmail } from "class-validator";

export class ReenviarActivacionDto {
  @IsEmail()
  email!: string;
}