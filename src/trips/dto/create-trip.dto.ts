import { IsString, IsIn, IsNumber, IsOptional, IsBoolean, IsNotEmpty, Min, Matches } from 'class-validator';

export class CreateTripDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date!: string;

  @IsString()
  @IsNotEmpty()
  departureCountry!: string;

  @IsString()
  @IsNotEmpty()
  departureCity!: string;

  @IsString()
  @IsNotEmpty()
  arrivalCountry!: string;

  @IsString()
  @IsNotEmpty()
  arrivalCity!: string;

  @IsOptional()
  @IsIn(['upcoming', 'in-progress', 'completed'])
  status?: 'upcoming' | 'in-progress' | 'completed';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNumber()
  @Min(1)
  totalCapacity!: number;

  @IsOptional()
  @IsBoolean()
  acceptingRequests?: boolean;
}
