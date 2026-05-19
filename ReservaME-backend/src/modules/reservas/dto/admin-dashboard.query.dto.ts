import { IsIn, IsOptional, IsString } from 'class-validator';

export type DashboardRange = 'HOY' | 'MES' | 'CUSTOM' | 'TOTAL';

export class AdminDashboardQueryDto {
  @IsOptional()
  @IsIn(['HOY', 'MES', 'CUSTOM', 'TOTAL'])
  range?: DashboardRange;

  // solo si range = CUSTOM
  @IsOptional()
  @IsString()
  from?: string; // ISO

  @IsOptional()
  @IsString()
  to?: string; // ISO
}
