import { IsNotEmpty, IsString } from "class-validator";

export class ReprogramarReservaDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  // ISO string: "2026-01-10T15:00:00.000Z"
  @IsString()
  @IsNotEmpty()
  startAt!: string;
}