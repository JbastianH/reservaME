import { IsBoolean } from "class-validator";

export class SetVisiblePortafolioDto {
  @IsBoolean()
  visible!: boolean;
}