import { IsString, IsOptional, IsNotEmpty, Matches } from 'class-validator';

export class UpdateTripResultDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  departureCity?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  arrivalCity?: string;
}
