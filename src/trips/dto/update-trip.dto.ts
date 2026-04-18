import { IsString, IsIn, IsNumber, IsOptional, IsBoolean, IsArray, Min, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TripDestinationDto } from './create-trip.dto';

export class UpdateTripDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date?: string;

  @IsOptional()
  @IsString()
  departureCountry?: string;

  @IsOptional()
  @IsString()
  departureCity?: string;

  @IsOptional()
  @IsString()
  arrivalCountry?: string;

  @IsOptional()
  @IsString()
  arrivalCity?: string;

  @IsOptional()
  @IsIn(['upcoming', 'in-progress', 'completed'])
  status?: 'upcoming' | 'in-progress' | 'completed';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalCapacity?: number;

  @IsOptional()
  @IsBoolean()
  acceptingRequests?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripDestinationDto)
  destinations?: TripDestinationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripDestinationDto)
  pickupLocations?: TripDestinationDto[];
}
