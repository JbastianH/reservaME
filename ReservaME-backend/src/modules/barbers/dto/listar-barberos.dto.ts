import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";

export class ListarBarberosDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(["name", "createdAt"])
  orderBy?: "name" | "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  orderDir?: "asc" | "desc";
}