import { IsISO8601 } from "class-validator";

export class ReprogramarReservaDto {
  @IsISO8601()
  startAt!: string; // ISO string
}