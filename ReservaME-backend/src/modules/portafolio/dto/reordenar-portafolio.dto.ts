import {
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class ReordenarItemDto {
  @IsString()
  id!: string;

  @IsInt()
  @Min(0)
  position!: number;
}

export class ReordenarPortafolioDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReordenarItemDto)
  items!: ReordenarItemDto[];
}